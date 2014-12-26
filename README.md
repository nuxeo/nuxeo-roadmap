nuxeo-roadmap
=============

Javascript single page visualizer for the Nuxeo roadmap, that queries Jira for displaying the content.

The website is available at : http://roadmap.nuxeo.com

Local install (without apache)
=

The following instructions works for any os if you have the followed programs installed: 
- git
- python

1.**Checkout** the project with git or **download** it as an archive.

2.Go to the project directory (in cmd line).

3.Start a web server.
> python -m SimpleHTTPServer

4.Cross origin must be forced or disabled in order to allow the roadmap to consume the jira rest api.
> In chrome, you can use this plugin: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi

5.Go to the roadmap url.
> This should be: http://localhost:8000

Local install (apache)
=

The following instructions works for any os if you have the followed programs installed: 
- git
- apache

1.**Checkout** the project or **download** it as an archive and put the source code **into your apache web directory** (most of the time */var/www* for linux).

2.Make sure that apache is started.

3.Cross origin must be forced or disabled in order to allow the roadmap to consume the jira rest api.
> Chrome: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi

4.Go to the roadmap url
> This should be: http://localhost/nuxeo-roadmap.

roadmap.js constants
=

>**ATTACHMENTS_FILTER**: A regex that is executed for each attachments. If the regex pass, the file will be displayed in its issue footer, if not the file is ignored.

>**CONTENT_TYPES**: A key-value object which contains a file extension as key and a content type as value. This object is used for transforming a binary to a file url (the content type is required by the javascript api).

>**EXTENSIONS_THUMBS**:  A key-value object which contains a file extension as key and an image url as value. This object is used when a thumb is rendered for an attachment (in the issue footer).

Ignore pdf attachments
=

In order to disable PDF attachments  (not showing them in the issue attachments footer), follow these steps :

1.Edit the **js/roadmap.js** file.

2.Locate the **ATTACHMENTS_FILTER** constant.

3.Remove **'|pdf'** from the regex.

4.Reload the page, the pdf attachments must have disappear.

Add more attachments
=

In order to add more attachments on issues, follow this steps:

1.Edit the **js/roadmap.js** file.

2.Locate the **ATTACHMENTS_FILTER** constant.

3.Update the regex in order to add the desired file extension.
 >For the docx file extension, the regex should look like: **/\.(png|jpeg|jpg|gif|pdf|docx)$/i**

4.Make sure that the desired attachments contents types are setted in the constant named **CONTENT_TYPES**.
>For docx files, the constant should contains this key-value:
>>**'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'**

5.Now if your new attachments aren't images, they will appear as a broken image in the issue footer. In order to have a thumb for files that aren't images, you have to update the constant named **EXTENSIONS_THUMBS**.
>For docx files, the constant should contains a key-value like this:
>> **'docx': '/url/to/your/thumb-image'**

6.Reload the page, your attachments should appear.