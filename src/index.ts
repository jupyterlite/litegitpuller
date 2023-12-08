import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { GithubPuller } from './githubpuller';

const gitPullerExtension: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/litegitpuller:plugin',
  autoStart: true,
  requires: [IDefaultFileBrowser],
  activate: (app: JupyterFrontEnd, defaultFileBrowser: IDefaultFileBrowser) => {
    console.log(
      'JupyterLab extension @jupyterlite/litegitpuller is activated!'
    );
    if (!(app.name === 'JupyterLite')) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const repo = urlParams.get('repo');

    if (!repo) {
      return;
    }

    const branch = urlParams.get('branch') || 'main';
    let filePath = urlParams.get('urlpath');

    const repoUrl = new URL(repo);
    repoUrl.hostname = 'api.github.com';
    repoUrl.pathname = `/repos${repoUrl.pathname}`;

    // TODO: delete the following line as soon as a dedicated url generator is available.
    if (filePath) {
      filePath =
        '/' +
        PathExt.relative(`tree/${PathExt.basename(repoUrl.href)}`, filePath);
    }

    const puller = new GithubPuller({
      defaultFileBrowser: defaultFileBrowser,
      contents: app.serviceManager.contents
    });

    puller.clone(repoUrl.href, branch).then(async basePath => {
      if (filePath) {
        app.commands.execute('filebrowser:open-path', {
          path: PathExt.join(basePath, filePath)
        });
      }
    });
  }
};

export default gitPullerExtension;
