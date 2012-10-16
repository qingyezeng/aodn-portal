Ext.namespace('Portal.search');

Portal.search.FacetedSearchResultsGrid = Ext.extend(Ext.grid.GridPanel, {
    frame: false,
    layout: 'fit',

    border: true,
    autoExpandColumn: 'mdDesc',

    enableDragDrop: true,

    initComponent: function() {
        var config = {
            colModel: new Ext.grid.ColumnModel({
                defaults: {
                    menuDisabled: true
                },
                columns: [
                    {
                        header: OpenLayers.i18n('logoHeading'),
                        width: 50,
                        xtype: 'templatecolumn',
                        tpl: '<img class="p-logo" src="'+Portal.app.config.catalogUrl+'/images/logos/{source}.gif"/>',
                        dataIndex: 'source'
                    },{
                        id: 'mdDesc',
                        header: OpenLayers.i18n('descHeading'),
                        dataIndex: 'title',
                        width: 150,
                        xtype: 'portal.common.facetedsearchactioncolumn',
                        items: [{
                            iconCls: 'p-result-info',
                            tooltip: OpenLayers.i18n('datasetInfo'),
                            width: 35,
                            height: 35,
                            handler: this.onViewMetadata,
                            scope: this
                        },{
                            getClass: this.getMapAddClass,
                            getTooltip: this.getAddMapTooltip,
                            width: 35,
                            height: 35,
                            handler: this.addToMapExecute,
                            scope: this
                        },{
                            getClass: this.getLayerSelectClass,
                            tooltip: OpenLayers.i18n('selectLayer'),
                            width: 35,
                            height: 35,
                            handler: this.selectLayerExecute,
                            scope: this
                        },{
                            getClass: this.getAddToDownloadClass,
                            tooltip: OpenLayers.i18n('ttAddToDownload'),
                            width: 35,
                            height: 35,
                            handler: this.addToCartExecute,
                            scope: this
                        },{
                            getClass: this.getShowLinkClass,
                            getTooltip: this.getShowLinkTooltip,
                            width: 35,
                            height: 35,
                            handler: this.showLink,
                            scope: this
                        },{
                            getClass: this.getSelectLinkClass,
                            tooltip: OpenLayers.i18n('selectLink'),
                            width: 35,
                            height: 35,
                            handler: this.selectLink,
                            scope: this
                        }]
                    }
                ]
            }),
            bbar: new Ext.PagingToolbar({
                pageSize: 15,
                items: [
                    {xtype: 'tbseparator'}, // Separator
                    new Ext.Button({
                        text: OpenLayers.i18n('btnAddAllToDownload'),
                        tooltip: OpenLayers.i18n('ttAddAllToDownload'),
                        cls: "x-btn-text-icon",
                        icon: "images/basket_add.png",
                        anchor: 'right',
                        handler: this.addAllToCartExecute,
                        scope: this
                    })
                ]
            })
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config));

        this.downloadProtocols = this._parseProtocols(Portal.app.config.downloadCartDownloadableProtocols);

        Portal.search.ResultsGrid.superclass.initComponent.apply(this, arguments);

        // TODO: Remove this HACK when proper paging service used - should bind the store not assign as below
        this.getBottomToolbar().store = this.store;

        this.addEvents('addlayer', 'rowenter', 'rowleave', 'adddownload');
    },

    afterRender: function(){
        Portal.search.ResultsGrid.superclass.afterRender.call(this);

        this.loadMask = new Portal.common.LoadMask(this.el, {msg:"Searching..."});

        this.getView().mainBody.on({
            scope    : this,
            mouseover: this.onMouseOver,
            mouseout : this.onMouseOut
        });
    },

    showMask: function(){
        if (this.rendered) {
            this.loadMask.show();
        }
    },

    hideMask: function(){
        if (this.rendered) {
            this.loadMask.hide();
        }
    },

    // trigger mouseenter event on row when applicable
    onMouseOver : function(e, target) {
        var row = this.getView().findRow(target);
        if (row && row !== this.lastRow) {
            var rowIndex = this.getView().findRowIndex(row);
            this.fireEvent("mouseenter", this, rowIndex, this.store
                .getAt(rowIndex), e);
            this.lastRow = row;
        }
    },

    // trigger mouseleave event on row when applicable
    onMouseOut: function(e, target) {
        if (this.lastRow) {
            if(!e.within(this.lastRow, true, true)){
                var lastRowIndex = this.getView().findRowIndex(this.lastRow);
                this.fireEvent("mouseleave", this, lastRowIndex, this.store.getAt(lastRowIndex), e);
                delete this.lastRow;
            }
        }
    },

    onViewMetadata: function(grid, rowIndex, colIndex) {
        var rec = this.store.getAt(rowIndex);
        var viewMetadataUrl = Portal.app.config.catalogUrl + '/srv/en/metadata.show\?uuid\='+rec.get('uuid');

        Portal.common.BrowserWindow.open(viewMetadataUrl);
    },

    getMapAddClass: function(v, metadata, rec, rowIndex, colIndex, store) {
        if (this.getProtocolCount(rec.get('links'), Portal.app.config.metadataLayerProtocols) == 1) {
            return 'p-result-map-add';
        } else {
            return 'p-result-disabled';
        }
    },

    getAddMapTooltip: function(v, metadata, rec, rowIndex, colIndex, store) {
        var linkRec = this.getLinkRec(rowIndex, Portal.app.config.metadataLayerProtocols);
        if (!linkRec) return '';
        var layerDesc = linkRec.get('title');
        return OpenLayers.i18n('addToMap', {layerDesc: layerDesc});
    },

    getShowLinkClass: function(v, metadata, rec, rowIndex, colIndex, store) {
        if (this.getProtocolCount(rec.get('links'), Portal.app.config.metadataLinkProtocols) == 1) {
            return 'p-result-show-link';
        } else {
            return 'p-result-disabled';
        }
    },

    getShowLinkTooltip: function(v, metadata, rec, rowIndex, colIndex, store) {
        var linkRec = this.getLinkRec(rowIndex, Portal.app.config.metadataLinkProtocols);
        if (!linkRec) return '';
        return linkRec.get('title');
    },

    getSelectLinkClass: function(v, metadata, rec, rowIndex, colIndex, store) {
        if (this.getProtocolCount(rec.get('links'), Portal.app.config.metadataLinkProtocols) > 1) {
            return 'p-result-show-link';
        } else {
            return 'p-result-disabled';
        }
    },

    getLayerSelectClass: function(v, metadata, rec, rowIndex, colIndex, store) {
        if (this.getProtocolCount(rec.get('links'), Portal.app.config.metadataLayerProtocols) > 1) {
            return 'p-result-map-add';
        } else {
            return 'p-result-disabled';
        }
    },

    getAddToDownloadClass: function(v, metadata, rec, rowIndex, colIndex, store) {
        var result = new Portal.search.data.CatalogResult({record: rec});
        var downloads = result.getDownloadLinks(this.downloadProtocols);

        if (downloads.length > 0) {
            return 'p-result-cart-add';
        } else {
            return 'p-result-disabled';
        }
    },

    selectLayerExecute: function(grid, rowIndex, colIndex) {
        var rec = this.store.getAt(rowIndex);
        var links = rec.get('links');
        var linkStore = new Portal.search.data.LinkStore({
            data: {links: links}
        });
        linkStore.filterByProtocols(Portal.app.config.metadataLayerProtocols);

        if (!this.layerSelectionWindow ) {
            this.layerSelectionWindow = this.buildLayerSelectionWindow(linkStore);
        } else {
            this.layerSelectionWindow.bindStore(linkStore);
        }

        this.layerSelectionWindow.show();
    },

    buildLayerSelectionWindow: function(linkStore) {
        return new Portal.search.LayerSelectionWindow({
            store: linkStore,
            modal: true,
            listeners: {
                scope: this,
                destroy: function() {
                    delete this.layerSelectionWindow;
                },
                addlayer: function(layerLink) {
                    this.fireEvent('addlayer', layerLink);
                }
            }
        });
    },

    showLink: function(grid, rowIndex, colIndex) {
        var linkRec = this.getLinkRec(rowIndex, Portal.app.config.metadataLinkProtocols);
        Portal.common.BrowserWindow.open(linkRec.get('url'));
    },

    selectLink: function(grid, rowIndex, colIndex) {
        var rec = this.store.getAt(rowIndex);
        var links = rec.get('links');
        var linkStore = new Portal.search.data.LinkStore({
            data: {links: links}
        });

        linkStore.filterByProtocols(Portal.app.config.metadataLinkProtocols);

        if (!this.linkSelectionWindow ) {
            this.linkSelectionWindow = this.buildLinkSelectionWindow(linkStore);
        } else {
            this.linkSelectionWindow.bindStore(linkStore);
        }

        this.linkSelectionWindow.show();
    },

    buildLinkSelectionWindow: function(linkStore) {
        return new Portal.search.LinkSelectionWindow({
            store: linkStore,
            modal: true,
            listeners: {
                scope: this,
                destroy: function() {
                    delete this.linkSelectionWindow;
                }
            }
        });
    },

    addToMapExecute: function(grid, rowIndex, colIndex) {
        this.fireEvent('addlayer', this.getLayerLink(rowIndex));
    },

    getProtocolCount: function(links, values) {
        var protocols = Ext.isString(values)?values.split('\n'):values;
        var count = 0;

        for (var i=0; i<links.length; i++) {
            for (var j=0; j<protocols.length; j++) {
                if (links[i].protocol==protocols[j].trim()) {
                    count++;
                }
            }
        }

        return count;
    },

    containsProtocol: function(protocolArray, protocolName) {

        if ( protocolName == undefined ) return false;

        for (var i=0; i < protocolArray.length; i++) {

            if (protocolArray[i].trim() == protocolName.trim()) {
                return true;
            }
        }

        return false;
    },

    addLinkDataToCart: function(recs) {
        var tuplesToAdd = new Array();

        Ext.each(recs, function(rec) {
            var result = new Portal.search.data.CatalogResult({record: rec});

            var recTuples = result.getDownloadLinks(this.downloadProtocols);

            Ext.each(recTuples, function(tuple) {
                tuplesToAdd.push(tuple)
            });
        }, this);

        addToDownloadCart( tuplesToAdd );
    },

    getLayerLink: function(rowIndex) {
        var rec = this.store.getAt(rowIndex);
        var links = rec.get('links');
        var linkStore = new Portal.search.data.LinkStore({
            data: {links: links}
        });
        linkStore.filterByProtocols(Portal.app.config.metadataLayerProtocols);

        return linkStore.getLayerLink(0);
    },

    addToCartExecute: function(grid, rowIndex, colIndex) {

        this.fireEvent('adddownload', grid.store.getAt(rowIndex));
    },

    addAllToCartExecute: function() { // button, event

        var recordsToAdd = new Array();

        this.getStore().each(
            function( rec ) {

                recordsToAdd.push( rec );
            },
            this
        );

        this.addLinkDataToCart( recordsToAdd );
    },

    getLinkRec: function(rowIndex, protocols) {
        var rec = this.store.getAt(rowIndex);
        var links = rec.get('links');
        var linkStore = new Portal.search.data.LinkStore({
            data: {links: links}
        });

        linkStore.filterByProtocols(protocols);
        return linkStore.getAt(0);
    },

    _parseProtocols: function(protocols) {
        var result = [];

        Ext.each(protocols.split("\n"), function(protocol) {
            result.push(protocol.trim())
        });

        return result;
    }
});

Ext.reg('portal.search.facetedsearchresultsgrid', Portal.search.FacetedSearchResultsGrid);