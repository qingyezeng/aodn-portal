/*
 * Copyright 2014 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

OpenLayers.SpatialConstraintMap = OpenLayers.Class(OpenLayers.Map, {

    initialize: function(div, options) {

        OpenLayers.Map.prototype.initialize.apply(this, arguments);

        this.events.addEventType('spatialconstraintuseradded');
        this.events.register(
            'spatialconstraintuseradded',
            this,
            function(geometry) {
                this.spatialConstraintControl.redraw(geometry);
            }
        );
    },

    getConstraint: function() {
        if (this.spatialConstraintControl) {
            return this.spatialConstraintControl.getConstraint();
        }

        return undefined;
    },

    isConstraintModified: function() {
        if (this.spatialConstraintControl) {
            return this.spatialConstraintControl.isModified();
        }
        else {
            return false;
        }
    },

    setDefaultSpatialConstraintType: function(spatialConstraintType) {
        this.defaultSpatialConstraintType = spatialConstraintType;
        this.resetSpatialConstraint();
    },

    setSpatialConstraintStyle: function(polygonStyle) {
        // Avoid unnecessary removal/addition of the control.
        if (this.polygonStyle != polygonStyle) {
            this.updateSpatialConstraintStyle(polygonStyle);
        }
    },

    getSpatialConstraintType: function() {
        return this.polygonStyle;
    },

    resetSpatialConstraint: function() {
        if (this.polygonStyle != this.defaultSpatialConstraintType || this.isConstraintModified()) {
            this.updateSpatialConstraintStyle(this.defaultSpatialConstraintType);
        }
    },

    updateSpatialConstraintStyle: function(polygonStyle) {
        this.polygonStyle = polygonStyle;

        this.navigationControl.deactivate();

        if (this.spatialConstraintControl) {
            this.spatialConstraintControl.removeFromMap();
        }

        if (polygonStyle == Portal.ui.openlayers.SpatialConstraintType.NONE) {
            this.spatialConstraintControl = undefined;
            this.navigationControl.activate();
            this.events.triggerEvent('spatialconstraintcleared');
        }
        else if (polygonStyle == Portal.ui.openlayers.SpatialConstraintType.POLYGON) {
            this.addSpatialConstraintControlToMap(OpenLayers.Handler.Polygon);
        }
        else if (polygonStyle == Portal.ui.openlayers.SpatialConstraintType.BOUNDING_BOX) {
            this.addSpatialConstraintControlToMap();
        }
        this.events.triggerEvent('spatialconstrainttypechanged', polygonStyle);
    },

    addSpatialConstraintControlToMap: function(handler) {
        Portal.ui.openlayers.control.SpatialConstraint.createAndAddToMap(this, handler);
    },

    CLASS_NAME: "OpenLayers.SpatialConstraintMap"
});
