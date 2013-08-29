/*
 * Copyright 2013 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */
describe("Portal.data.ActiveGeoNetworkRecordStore", function() {

    beforeEach(function() {
        Ext.namespace('Portal.app.config');
        Portal.app.config.metadataLayerProtocols = "OGC:WMS-1.1.1-http-get-map\nOGC:WMS-1.3.0-http-get-map";
    });

    /**
     *  A singleton instance of the store is used to store the 'active' geonetwork records.
     */
    describe('active geonetwork records store', function() {

        var activeRecordStore;

        beforeEach(function() {
            Portal.data.ActiveGeoNetworkRecordStore.THE_ACTIVE_RECORDS_INSTANCE = undefined;
            activeRecordStore = Portal.data.ActiveGeoNetworkRecordStore.instance();
        });

        describe('activeRecordsInstance', function() {
            it('accessor function', function() {
                expect(Portal.data.ActiveGeoNetworkRecordStore.instance()).toBeTruthy();
            });

            it('singleton', function() {
                var firstCall = Portal.data.ActiveGeoNetworkRecordStore.instance();
                var secondCall = Portal.data.ActiveGeoNetworkRecordStore.instance();
                expect(firstCall).toBe(secondCall);
            });
        });

        describe('interaction with MsgBus', function() {

            var myRecord;

            beforeEach(function() {
                spyOn(Ext.MsgBus, 'publish');
                myRecord = new Portal.data.GeoNetworkRecord({
                    title: 'my record'
                });
            });

            describe('when adding/removing records', function() {
                it('geonetwork added message is fired', function() {
                    activeRecordStore.add(myRecord);
                    expect(Ext.MsgBus.publish).toHaveBeenCalledWith('activegeonetworkrecordadded', [myRecord]);
                });

                it('geonetwork removed message is fired', function() {
                    activeRecordStore.add(myRecord);

                    activeRecordStore.remove(myRecord);
                    expect(Ext.MsgBus.publish).toHaveBeenCalledWith('activegeonetworkrecordremoved', myRecord);
                });
            });
        });

        describe('interaction with LayerStore', function() {

            var layer = new OpenLayers.Layer.WMS(
                'the tile',
                'http://some/wms/url',
                {},
                { isBaseLayer: false }
            );

            describe('record with layer', function() {

                var myRecord;

                beforeEach(function() {
                    myRecord = new Portal.data.GeoNetworkRecord({
                        links: [{
                            href: 'http://somelayer/wms',
                            name: 'the name',
                            protocol: 'OGC:WMS-1.1.1-http-get-map',
                            title: 'a really interesting record',
                            type: 'some type'
                        }]
                    });
                });

                it('layer added to LayerStore', function() {
                    spyOn(Portal.data.LayerStore.instance(), 'addUsingLayerLink');

                    activeRecordStore.add(myRecord);

                    expect(Portal.data.LayerStore.instance().addUsingLayerLink).toHaveBeenCalled();
                    expect(Portal.data.LayerStore.instance().addUsingLayerLink.mostRecentCall.args[0]).toEqual(
                        myRecord.getFirstWmsLink());
                });

                describe('callback', function() {
                    var layerRecord;

                    beforeEach(function() {
                        layerRecord = new GeoExt.data.LayerRecord({
                            layer: layer,
                            title: layer.name
                        });

                        spyOn(Portal.data.LayerStore.instance(), 'addUsingLayerLink').andCallFake(
                            function(layerLink, layerRecordCallback) {
                                layerRecordCallback(layerRecord);
                            });

                        activeRecordStore.add(myRecord);
                    });

                    it('adds layer record to geonetwork record', function() {
                        expect(myRecord.layerRecord).toBe(layerRecord);
                    });

                    it('adds geonetwork record to layer record', function() {
                        expect(layerRecord.parentGeoNetworkRecord).toBe(myRecord);
                    });

                    it('adds geonetwork record to openlayer', function() {
                        expect(layerRecord.get('layer').parentGeoNetworkRecord).toBe(myRecord);
                    });
                });

                it('layer removed from LayerStore', function() {
                    var layerRecord = new GeoExt.data.LayerRecord({
                        layer: layer,
                        title: layer.name
                    });
                    myRecord.layerRecord = layerRecord;
                    spyOn(Portal.data.LayerStore.instance(), 'removeUsingOpenLayer');
                    activeRecordStore.add(myRecord);

                    activeRecordStore.remove(myRecord);

                    expect(Portal.data.LayerStore.instance().removeUsingOpenLayer).toHaveBeenCalledWith(layer);
                });
            });

            describe('record without layer', function() {
                var myRecord = new Portal.data.GeoNetworkRecord({
                    title: 'a really interesting record'
                });

                it('should not call addUsingLayerLink when record without layer is added', function() {
                    spyOn(Portal.data.LayerStore.instance(), 'addUsingLayerLink');

                    activeRecordStore.add(myRecord);

                    expect(Portal.data.LayerStore.instance().addUsingLayerLink).not.toHaveBeenCalled();
                });

                it('should not call removeUsingOpenLayer when record without layer is removed', function() {
                    spyOn(Portal.data.LayerStore.instance(), 'removeUsingOpenLayer');
                    activeRecordStore.add(myRecord);

                    activeRecordStore.remove(myRecord);

                    expect(Portal.data.LayerStore.instance().removeUsingOpenLayer).not.toHaveBeenCalledWith(layer);
                });
            });

            describe('on clear', function() {
                it('all layers removed from LayerStore', function() {
                    var layerRecord = new GeoExt.data.LayerRecord({
                        layer: layer,
                        title: layer.name
                    });
                    var myRecord = new Portal.data.GeoNetworkRecord({
                        title: 'a really interesting record'
                    });
                    myRecord.layerRecord = layerRecord;

                    var layer2 = new OpenLayers.Layer.WMS(
                        'the tile',
                        'http://some/wms/url',
                        {},
                        { isBaseLayer: false });
                    var layerRecord2 = new GeoExt.data.LayerRecord({
                        layer: layer2,
                        title: layer2.name
                    });
                    var myRecord2 = new Portal.data.GeoNetworkRecord({
                        title: 'my record'
                    });

                    spyOn(activeRecordStore, '_removeFromLayerStore');
                    activeRecordStore.add(myRecord);
                    activeRecordStore.add(myRecord2);

                    activeRecordStore.removeAll();

                    expect(activeRecordStore._removeFromLayerStore.calls.length).toBe(2);
                    expect(activeRecordStore._removeFromLayerStore.calls[0].args[0]).toBe(myRecord);
                    expect(activeRecordStore._removeFromLayerStore.calls[1].args[0]).toBe(myRecord2);
                });
            });
        });

        describe('downloader delegation', function() {
            it('downloader initialised', function() {
                expect(activeRecordStore.downloader).toBeTruthy();
            });

            it('initiate download', function() {
                spyOn(activeRecordStore.downloader, 'start');
                activeRecordStore.initiateDownload();
                expect(activeRecordStore.downloader.start).toHaveBeenCalled();
            });
        });

        describe('JSON encoding', function() {
            var itemsDecoded;

            var addTestRecordsToStore = function() {
                var firstRecord = new Portal.data.GeoNetworkRecord({
                    uuid: '111111',
                    title: 'first title',
                    links: [
                        {
                            href: 'http://host/some.html',
                            name: 'imos:radar_stations',
                            protocol: 'some protocol',
                            title: 'the first title',
                            type: 'text/html'
                        }
                    ]
                });

                var secondRecord = new Portal.data.GeoNetworkRecord({
                    uuid: '222222',
                    title: 'second title',
                    links: [
                        {
                            href: 'http://host/some.pdf',
                            name: 'imos:radar_stations',
                            protocol: 'some protocol',
                            title: 'the second title',
                            type: 'text/pdf'
                        }
                    ]
                });

                activeRecordStore.add(firstRecord);
                activeRecordStore.add(secondRecord);
            }

            beforeEach(function() {
                addTestRecordsToStore();

                // Decode again as comparing strings would be too brittle.
                itemsDecoded = Ext.util.JSON.decode(activeRecordStore.getItemsEncodedAsJson());
            });

            it('item per record', function() {
                expect(itemsDecoded.length).toBe(2);
            });

            describe('first item', function() {
                it('properties', function() {
                    expect(itemsDecoded[0].uuid).toBe('111111');
                    expect(itemsDecoded[0].title).toBe('first title');
                });

                it('links', function() {
                    expect(itemsDecoded[0].links.length).toBe(1);
                    expect(itemsDecoded[0].links[0].href).toBe('http://host/some.html');
                    expect(itemsDecoded[0].links[0].name).toBe('imos:radar_stations');
                    expect(itemsDecoded[0].links[0].protocol).toBe('some protocol');
                    expect(itemsDecoded[0].links[0].title).toBe('the first title');
                    expect(itemsDecoded[0].links[0].type).toBe('text/html');
                });
            });

            describe('second item', function() {
                it('properties', function() {
                    expect(itemsDecoded[1].uuid).toBe('222222');
                    expect(itemsDecoded[1].title).toBe('second title');
                });
            });
        });
    });
});