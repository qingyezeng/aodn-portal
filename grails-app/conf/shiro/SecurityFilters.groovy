/*
* Copyright 2012 IMOS
*
* The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
*
*/

package shiro

import au.org.emii.portal.Filter
import au.org.emii.portal.Layer
import au.org.emii.portal.Server
import au.org.emii.portal.User
import org.apache.shiro.SecurityUtils

/**
 * Generated by the Shiro plugin. This filters class protects all URLs
 * via access control by convention.
 */
class SecurityFilters {
    def checkWmsScannerService

    def filters = {

        catchRememberMeCookie(url: "/**") {

            before = {

                // Remove the rememberMe cookie
                request.cookies.find({ it.name == "rememberMe" }).each {

                    getSession() // Ensure a Session exists before we start the response

                    log.info "Removing rememberMe cookie: ${it.value}"

                    it.maxAge = 0
                    response.addCookie it

                    def subject = SecurityUtils.subject

                    log.info "Logging user '${subject.principal}' out"
                    subject.logout()
                }
            }
        }

        aodaacAccess(controller: "aodaac", action: "productInfo|createJob|updateJob|cancelJob|deleteJob|userJobInfo") {
            before = {

                logRequest("aodaacAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        homeAccess(controller: "home", action: "index|config") {
            before = {

                logRequest("homeAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        splashAccess(controller: "splash", action: "index|links|community") {
            before = {

                logRequest("splashAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        configAccess(controller: "config", action: "viewport") {
            before = {

                logRequest("configAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        depthAccess(controller: "depth", action: "index") {
            before = {

                logRequest("depthAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        checkLayerAvailabilityAccess(controller: "checkLayerAvailability", action: "show") {
            before = {
                logRequest("checkLayerAvailabilityAccess", controllerName, actionName)
                // Allow all access
                request.accessAllowed = true
            }
        }

        serverAccess(controller: "server", action: "listAllowDiscoveriesAsJson") {
            before = {

                logRequest("serverAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        layerAccess(controller: "layer", action: "listBaseLayersAsJson|showLayerByItsId|findLayerAsJson|getFormattedMetadata|saveOrUpdate|server|configuredbaselayers|defaultlayers|getFiltersAsJSON") {
            before = {

                logRequest("layerAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        menuAccess(controller: "menu", action: "json") {
            before = {

                logRequest("menuAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        proxyAccess(controller: "proxy", action: "index|cache|wmsOnly|downloadGif") {
            before = {

                logRequest("proxyAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        downloadCartAccess(controller: "downloadCart", action: "download") {
            before = {

                logRequest("downloadCartAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        authAccess(controller: "auth", action: "*") { // The plugin makes all actions on this controller public anyway, this is just for completeness
            before = {

                logRequest("authAccess", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        snapshotAccess(controller: "snapshot", action: "show|loadMap") {
            before = {

                logRequest("snapshot", controllerName, actionName)

                // Allow all access
                request.accessAllowed = true
            }
        }

        editFiltersAccess(controller: "layer", action: "editFilters") {
            before = {
                def layer = Layer.get(params.id);
                def permission = _hasLayerFilterPermission(layer)

                if (permission) {
                    request.accessAllowed = true
                }
            }
        }

        filterSaveAccess(controller: "filter", action: "save") {
            before = {
                def layer = Layer.get(params.layerId)
                def permission = _hasLayerFilterPermission(layer)

                if (permission) {
                    request.accessAllowed = true
                }
            }
        }

        filterUpdateAccess(controller: "filter", action: "updateFilter") {
            before = {
                request.accessAllowed = true
            }
        }

        filterAccess(controller: "filter", action: "edit|update|delete") {
            before = {
                def filter = Filter.get(params.id)
                def permission = _hasLayerFilterPermission(filter.layer)

                if (permission) {
                    request.accessAllowed = true
                }
            }
        }

        wmsScannerAccess(controller: "wmsScanner", action: "callUpdate|callDelete") {
            before = {
                def server = checkWmsScannerService.getServerFromJob(params.scanJobId)

	            if (server && _isServerOwner(server)) {
		            request.accessAllowed = true
	            }
            }
        }

        wmsScannerRegisterAccess(controller: "wmsScanner", action: "callRegister") {
            before = {
                def permission = _isServerOwner(Server.get(params.serverId))
                if (permission) {
                    request.accessAllowed = true
                }

            }
        }

        all(uri: "/**") {
            before = {
                // Check if request has been allowed by another filter
                if (request.accessAllowed) return true

                logRequest("all", controllerName, actionName)

                // Ignore direct views (e.g. the default main index page).
                if (!controllerName) return true

                // Access control by convention.
                if (!accessControl(auth: false)) { // "auth: false" means it will accept remembered users as well as those who logged-in in this session
                    return false
                }

                return true
            }
        }
    }

    def _hasLayerFilterPermission(layer) {
        def server = layer.server;

        def userInstance = User.current()
        if (userInstance && server.owners.contains(userInstance)) {
            // Allow all access
            return true
        }
        else {
            // Disallow all access
            return false
        }
    }

    def _isServerOwner(server) {
        def userInstance = User.current()
        def serverList = []

        if (userInstance) {
            serverList = Server.withCriteria {
                owners {
                    eq('id', userInstance.id)
                }
            }
        }

        def allowedUris = serverList*.getUri()

        if (allowedUris.contains(server.uri.trim())) {
            return true
        }
        return false
    }

    private void logRequest(String filterName, String controllerName, String actionName) {

        log.debug "Request matches ${filterName} filter. Request: controllerName = '${controllerName}', actionName = '${actionName}'."
    }
}
