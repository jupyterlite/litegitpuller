# litegitpuller

A Jupyterlab/jupyterlite extension to fetch github repositories.

As for [nbgitpuller](https://github.com/jupyterhub/nbgitpuller), information about the repository to fetch is set in the URL.

It can be tried with the current documentation, by providing search parameters in the current URL of the documentation.

The parameters to provide must be formatted as in `nbgitpuller`. They can be generated with [nbgitpuller link generator](https://nbgitpuller.readthedocs.io/en/latest/link.html).

Example: <https://litegitpuller.readthedocs.io/en/latest/index.html?repo=https%3A%2F%2Fgithub.com%2Fbrichet%2Ftesting-repo&urlpath=tree%2Ftesting-repo%2Fnotebooks%2Fsimple.ipynb&branch=main>

**NOTE**:
Fetch a repository uses the unauthenticated Github API to fetch each file, with a capacity of 60 files per hour (https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#rate-limits-for-requests-from-personal-accounts).\
Do not expect to fetch a large repository with it.

```{eval-rst}
.. jupyterlite::
   :width: 100%
   :height: 600px
   :prompt: Try JupyterLite!
   :prompt_color: #00aa42
   :search_params: branch, repo, urlpath
```
