nuxeo-roadmap
=============

Javascript single page visualizer for the Nuxeo roadmap, that queries Jira for displaying the content.

Local install (without apache)
=

The following instructions works for any os if you have the followed programs installed: 
- git
- python

1.**Checkout** the project with git or **download** it as an archive

2.Go to the project directory (in cmd line)

3.Start a web server
> python -m SimpleHTTPServer

4.Install a CORS extension for your browser in order to allow the roadmap to consume the jira rest api.
> For chrome: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?utm_source=chrome-ntp-icon

5.Go to the roadmap url
> This should be: http://localhost:8000

Local install (apache)
=

The following instructions works for any os if you have the followed programs installed: 
- git
- apache

1.**Checkout** the project or **download** it as an archive and put the source code **into your apache web directory** (most of the time */var/www* for linux)

2.Make sure that apache is started

3.Install a CORS extension for your browser in order to allow the roadmap to consume the jira rest api.
> Chrome: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?utm_source=chrome-ntp-icon

4.Go to the roadmap url
> This should be: http://localhost/nuxeo-roadmap