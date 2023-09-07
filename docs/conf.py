# Configuration file for the Sphinx documentation builder.

project = 'litegitpuller'
copyright = '2023, Jupyter Development Team'
author = 'Jupyter Development Team'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    'jupyterlite_sphinx',
    'myst_parser',
]

templates_path = ['_templates']
exclude_patterns = []


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'pydata_sphinx_theme'
html_static_path = ['_static']

jupyterlite_bind_ipynb_suffix = False