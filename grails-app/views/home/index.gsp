<%--

Copyright 2012 IMOS

The AODN/IMOS Portal is distributed under the terms of the GNU General Public License

--%>

<html>
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8" />
        <meta http-equiv="content-script-type" content="text/javascript" />
        <meta http-equiv="X-UA-Compatible" content="IE=8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />

        <title>${configInstance?.name}</title>

        ${buildInfo}

        <!--link rel="stylesheet" media="print" type="text/css"  href="${resource(dir: 'css', file: 'mapprint.css')}" /-->
        <link rel="stylesheet" type="text/css" href="${resource(dir: 'js', file: 'GeoExt1.1/resources/css/geoext-all.css')}" />
        <!-- User extensions -->
        <link rel="stylesheet" type="text/css" href="${resource(dir: 'js', file: 'ext-ux/SuperBoxSelect/superboxselect.css')}" />
        <link rel="stylesheet" type="text/css" href="${resource(dir: 'js', file: 'ext-ux/Hyperlink/hyperlink.css')}" />

        <g:render template="/js_includes"></g:render>
        <g:render template="/public_theme_includes"></g:render>

        <script type="text/javascript">
            var isChrome = !!window.chrome;
            var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0
            if (!(isChrome || isFirefox)) {
                alert(OpenLayers.i18n('ieWarningMessage'));
            }

            // Init step One
            Ext.onReady(Portal.app.init, Portal.app);

        </script>

    </head>

    <body>

        <g:render template="/header/mainPortalHeader" model="['showLinks': true, 'configInstance': configInstance]"></g:render>

        <%-- Display message from Grails app --%>
        <g:if test="${flash.openIdMessage}">
            <script type="text/javascript">
                Ext.Msg.alert("Message", "${flash.openIdMessage.encodeAsHTML()}");
            </script>
        </g:if>
    </body>
</html>
