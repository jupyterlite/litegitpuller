import { PathExt } from '@jupyterlab/coreutils';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';

/**
 * The abstract class for GitPuller using API.
 */
export abstract class GitPuller {
  /**
   * The constructor for the GitPuller abstract class.
   */
  constructor(options: GitPuller.IOptions) {
    this._defaultFileBrowser = options.defaultFileBrowser;
    this._contents = options.contents;
  }

  /**
   * The function to clone a repository.
   *
   * @param url - base URL of the repository using the API.
   * @param branch - the targeted branch.
   * @param basePath - the base directory where to clone the repo.
   * @returns the path of the created directory.
   */
  async clone(url: string, branch: string, basePath: string): Promise<string> {
    await this.createTree([basePath]);

    const fileList = await this.getFileList(url, branch);

    await this.createTree(fileList.directories, basePath).then(async () => {
      for (const file of fileList.files) {
        const filePath = basePath ? PathExt.join(basePath, file) : file;
        if (await this.fileExists(filePath)) {
          this.addUploadError('File already exist', filePath);
          continue;
        }

        // Upload missing files.
        const fileContent = await this.getFile(url, file, branch);

        await this.createFile(filePath, fileContent.blob, fileContent.type);
      }
    });

    this._errors.forEach((value, key) => {
      console.warn(
        `The following files have not been uploaded.\nCAUSE: ${key}\nFILES: `,
        value
      );
    });

    return basePath;
  }

  /**
   * Get files and directories list.
   * This function must be defined by the classes that extends this one.
   *
   * @param url - base URL of the repository using the API.
   * @param branch - the targeted branch.
   */
  abstract getFileList(
    url: string,
    branch: string
  ): Promise<GitPuller.IFileList>;

  /**
   * Get the content of a file.
   * This function must be defined by the classes that extends this one.
   *
   * @param url - base URL of the repository using the API.
   * @param path - path of the file from the root of the repository.
   * @param branch - the targeted branch.
   */
  abstract getFile(
    url: string,
    path: string,
    branch: string
  ): Promise<GitPuller.IFile>;

  /**
   * Create empty directories in content manager.
   *
   * @param directories - A list of directories.
   * @param basePath - The root of the directories path.
   */
  protected async createTree(
    directories: string[],
    basePath: string | null = null
  ): Promise<void> {
    directories.sort();
    for (let directory of directories) {
      directory = basePath ? PathExt.join(basePath, directory) : directory;
      const options = {
        type: 'directory' as Contents.ContentType,
        path: PathExt.dirname(directory)
      };
      // Create directory if it does not exist.
      await this._contents.get(directory, { content: false }).catch(() => {
        this._contents.newUntitled(options).then(async newDirectory => {
          await this._contents.rename(newDirectory.path, directory);
        });
      });
    }
  }

  /**
   * Check whether a file exists or not in the content manager.
   *
   * @param filePath - the file to check.
   */
  protected async fileExists(filePath: string): Promise<boolean> {
    return this._contents
      .get(filePath, { content: false })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  /**
   * Create a new file in the content manager.
   *
   * @param filePath - the path to the file.
   * @param blob - the file content.
   * @param type - the file type.
   */
  protected async createFile(
    filePath: string,
    blob: Blob,
    type: string
  ): Promise<void> {
    let filename = PathExt.basename(filePath);
    let inc = 0;
    let uniqueFilename = false;

    // The file must be first created at root path and then moved to its final path.
    // Let's ensure an other file with the same name does not exists at root.
    while (!uniqueFilename) {
      await this._contents
        .get(filename, { content: false })
        .then(() => {
          filename = `${filename}_${inc}`;
          inc++;
        })
        .catch(e => {
          uniqueFilename = true;
        });
    }

    const file = new File([blob], filename, { type });
    await this._defaultFileBrowser.model.upload(file).then(async model => {
      if (!(model.path === filePath)) {
        await this._contents.rename(model.path, filePath);
      }
    });
  }

  /**
   * Add upload error in the map.
   *
   * @param error - the error.
   * @param path - the path of the file in error.
   */
  protected addUploadError(error: string, path: string) {
    const errorFiles = this._errors.get(error) ?? [];
    this._errors.set(error, [...errorFiles, path]);
  }

  protected _errors = new Map<string, string[]>();
  protected _defaultFileBrowser: IDefaultFileBrowser;
  protected _contents: Contents.IManager;
}

/**
 * The GitPuller namespace.
 */
export namespace GitPuller {
  /**
   * The constructor options for the constructor.
   */
  export interface IOptions {
    defaultFileBrowser: IDefaultFileBrowser;
    contents: Contents.IManager;
  }

  /**
   * The files and directories list.
   */
  export interface IFileList {
    directories: string[];
    files: string[];
  }

  /**
   * The file content.
   */
  export interface IFile {
    blob: Blob;
    type: string;
  }

  /**
   * The error on file upload.
   */
  export interface IUploadError {
    type: string;
    file: string;
  }
}

/**
 * The class to clone a repository from Github.
 */
export class GithubPuller extends GitPuller {
  /**
   * Get files and directories list.
   *
   * @param url - base URL of the repository using the API.
   * @param branch - the targeted branch.
   */
  async getFileList(url: string, branch: string): Promise<GitPuller.IFileList> {
    const fetchUrl = `${url}/git/trees/${branch}?recursive=true`;
    const fileList = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'request'
      }
    })
      .then(resp => resp.json())
      .then(data => data.tree as any[]);

    const directories = Object.values(fileList)
      .filter(fileDesc => fileDesc.type === 'tree')
      .map(directory => directory.path as string);

    const files = Object.values(fileList)
      .filter(fileDesc => fileDesc.type === 'blob')
      .map(file => file.path);

    return { directories, files };
  }

  /**
   * Get the content of a file.
   *
   * @param url - base URL of the repository using the API.
   * @param path - path of the file from the root of the repository.
   * @param branch - the targeted branch.
   */
  async getFile(
    url: string,
    path: string,
    branch: string
  ): Promise<GitPuller.IFile> {
    const fetchUrl = `${url}/contents/${path}?ref=${branch}`;
    const downloadUrl = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'request'
      }
    })
      .then(resp => resp.json())
      .then(data => data.download_url);

    const resp = await fetch(downloadUrl);
    const blob = await resp.blob();
    const type = resp.headers.get('Content-Type') ?? '';

    return { blob, type };
  }
}

/**
 * The class to clone a repository from a Gitlab server.
 */
export class GitlabPuller extends GitPuller {
  /**
   * Get files and directories list.
   *
   * @param url - base URL of the repository using the API.
   * @param branch - the targeted branch.
   */
  async getFileList(url: string, branch: string): Promise<GitPuller.IFileList> {
    const fetchUrl = `${url}/repository/tree?ref=${branch}&recursive=true`;
    const fileList = await fetch(fetchUrl, {
      method: 'GET'
    })
      .then(resp => resp.json())
      .then(data => data as any[]);

    const directories = Object.values(fileList)
      .filter(fileDesc => fileDesc.type === 'tree')
      .map(directory => directory.path as string);

    const files = Object.values(fileList)
      .filter(fileDesc => fileDesc.type === 'blob')
      .map(file => file.path);

    return { directories, files };
  }

  /**
   * Get the content of a file.
   *
   * @param url - base URL of the repository using the API.
   * @param path - path of the file from the root of the repository.
   * @param branch - the targeted branch.
   */
  async getFile(
    url: string,
    path: string,
    branch: string
  ): Promise<GitPuller.IFile> {
    const fetchUrl = `${url}/repository/files/${encodeURIComponent(
      path
    )}/raw?ref=${branch}`;

    const resp = await fetch(fetchUrl);
    const blob = await resp.blob();
    const type = resp.headers.get('Content-Type') ?? '';

    return { blob, type };
  }
}
