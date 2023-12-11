# litegitpuller

A Jupyterlab/jupyterlite extension to fetch git repository (Github or Gitlab).

As for [nbgitpuller](https://github.com/jupyterhub/nbgitpuller), information about the
repository to fetch has to be set in the URL.

```{eval-rst}
.. jupyterlite::
   :width: 100%
   :height: 600px
   :prompt: Try JupyterLite!
   :prompt_color: #00aa42
   :search_params: ["branch", "repo", "urlpath", "provider"]
```

## Parameters

The parameters to provide must be formatted as in `nbgitpuller`.\
They can be (partially) generated with [nbgitpuller link generator]
(https://nbgitpuller.readthedocs.io/en/latest/link.html).

Currently the allowed parameters are:

- `repo`: (**required**) the github repository to fetch.
- `branch`: the branch of the repository to fetch (default to *main*).
- `urlpath`: the path to a notebook file to open (relative to the root of the repository).
- `provider`: The provider of the API. Currently it supports *Github* and *Gitlab* API.

## Limitations

Fetching a Github repository uses the unauthenticated Github API to fetch each file, with a
capacity of 60 files per hour,
see [github API](https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#rate-limits-for-requests-from-personal-accounts).

Do not expect to fetch a large repository with it.

## Try it

It can be tried with the current documentation, by providing parameters in the current
URL of the documentation. These parameters will be used to fetch a repository in the
Jupyterlite embedded in the page.

- Fetching a Github repository:

   <a href="https://litegitpuller.readthedocs.io/en/latest/index.html?repo=https%3A%2F%2Fgithub.com%2Fbrichet%2Ftesting-repo&urlpath=tree%2Ftesting-repo%2Fnotebooks%2Fsimple.ipynb&branch=main">
      https://litegitpuller.readthedocs.io/en/latest/index.html?repo=https%3A%2F%2Fgithub.com%2Fbrichet%2Ftesting-repo&urlpath=tree%2Ftesting-repo%2Fnotebooks%2Fsimple.ipynb&branch=main
   </a>

- Fetching a Gitlab repository:

   <a href="https://litegitpuller.readthedocs.io/en/latest/index.html?repo=https%3A%2F%2Fgitlb.com%2Fbrichet1%2Ftesting-repo&urlpath=tree%2Ftesting-repo%2Fnotebooks%2Fsimple.ipynb&branch=main&
   provider=gitlab">
      https://litegitpuller.readthedocs.io/en/latest/index.html?repo=https%3A%2F%2Fgithub.com%2Fbrichet%2Ftesting-repo&urlpath=tree%2Ftesting-repo%2Fnotebooks%2Fsimple.ipynb&
      branch=main&provider=gitlab
   </a>
