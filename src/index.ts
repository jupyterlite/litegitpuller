import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { PathExt, URLExt } from '@jupyterlab/coreutils';
import {
  Contents,
  IDefaultDrive,
  ServerConnection
} from '@jupyterlab/services';
import { GitPuller, GithubPuller, GitlabPuller } from './gitpuller';

/**
 * Test if nbgitpuller extension is also installed by requesting its Rest API.
 * This test avoid fetching the same repository two times.
 */
export async function testNbGitPuller(): Promise<boolean> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(settings.baseUrl, 'git-pull', 'api');
  let response: Response;
  try {
    response = await ServerConnection.makeRequest(
      requestUrl,
      { method: 'GET' },
      settings
    );
  } catch (error) {
    return false;
  }

  if (!response.ok) {
    return false;
  }

  return true;
}

const gitPullerExtension: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/litegitpuller:plugin',
  autoStart: true,
  requires: [IDefaultDrive],
  activate: async (app: JupyterFrontEnd, drive: Contents.IDrive) => {
    if (await testNbGitPuller()) {
      console.log(
        '@jupyterlite/litegitpuller is not activated, to avoid conflict with nbgitpuller'
      );
      return;
    }

    console.log(
      'JupyterLab extension @jupyterlite/litegitpuller is activated!'
    );

    const urlParams = new URLSearchParams(window.location.search);
    const repo = urlParams.get('repo');

    if (!repo) {
      return;
    }

    let puller: GitPuller | null = null;

    const branch = urlParams.get('branch') || 'main';
    const provider = urlParams.get('provider') || 'github';
    const filePath = urlParams.get('urlpath');
    const uploadPath = urlParams.get('uploadpath') || '/';

    const basePath = PathExt.join(uploadPath, PathExt.basename(repo));

    const repoUrl = new URL(repo);
    if (provider === 'github') {
      if (repoUrl.hostname !== 'github.com') {
        console.warn(
          'litegitpuller: the URL does not match with a GITHUB repository'
        );
        return;
      }
      repoUrl.hostname = 'api.github.com';
      repoUrl.pathname = `/repos${repoUrl.pathname}`;
      puller = new GithubPuller({
        drive: drive
      });
    } else if (provider === 'gitlab') {
      // Gitlab needs the repo path to be encoded.
      repoUrl.pathname = `/api/v4/projects/${encodeURIComponent(
        repoUrl.pathname.slice(1)
      )}`;
      puller = new GitlabPuller({
        drive: drive
      });
    }

    if (!puller) {
      return;
    }

    puller
      .clone(repoUrl.href, branch, basePath, repoPath => {
        // pre-open the repo path to show some progress
        app.commands.execute('filebrowser:open-path', {
          path: PathExt.join(repoPath, repoPath)
        });
      })
      .then(repoPath => {
        // open the file path, if provided
        if (filePath) {
          app.commands.execute('filebrowser:open-path', {
            path: PathExt.join(repoPath, filePath)
          });
        }
      });
  }
};

export default gitPullerExtension;
