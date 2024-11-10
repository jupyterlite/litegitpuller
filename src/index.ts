import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { PathExt, URLExt } from '@jupyterlab/coreutils';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { ServerConnection } from '@jupyterlab/services';
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
  requires: [IDefaultFileBrowser],
  activate: async (
    app: JupyterFrontEnd,
    defaultFileBrowser: IDefaultFileBrowser
  ) => {
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

    const basePath = PathExt.join(defaultFileBrowser.model.path, PathExt.basename(repo));
    const branch = urlParams.get('branch') || 'main';
    const provider = urlParams.get('provider') || 'github';
    let filePath = urlParams.get('urlpath');

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
        defaultFileBrowser: defaultFileBrowser,
        contents: app.serviceManager.contents
      });
    } else if (provider === 'gitlab') {
      // Gitlab needs the repo path to be encoded.
      repoUrl.pathname = `/api/v4/projects/${encodeURIComponent(
        repoUrl.pathname.slice(1)
      )}`;
      puller = new GitlabPuller({
        defaultFileBrowser: defaultFileBrowser,
        contents: app.serviceManager.contents
      });
    }

    if (!puller) {
      return;
    }

    puller.clone(repoUrl.href, branch, basePath).then(async basePath => {
      if (filePath) {
        // TODO: delete the following line as soon as a dedicated url generator is available.
        filePath = PathExt.relative('tree/', filePath);
        app.commands.execute('filebrowser:open-path', {
          path: filePath
        });
      }
    });
  }
};

export default gitPullerExtension;
