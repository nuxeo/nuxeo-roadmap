nuxeo-roadmap
=============

Javascript single page visualizer for the Nuxeo roadmap, that queries Jira for displaying the content.


Local install
=

1.Checkout the insterested branch
> git clone "project-url"  -b "branch"

2.Go to the project directory
> cd nuxeo-roadmap

3.Start a web server
> python -m SimpleHTTPServer

4.Install a web browser CORS extension in order to allow the roadmap to consume the jira rest api.
> For chrome: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?utm_source=chrome-ntp-icon

5.Go to the roadmap url
> The url should be (if you have followed the instruction number three): localhost:8000
