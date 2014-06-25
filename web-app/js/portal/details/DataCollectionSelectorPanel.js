/*
 * Copyright 2014 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

Ext.namespace('Portal.details');

Portal.details.DataCollectionSelectorPanel = Ext.extend(Ext.Panel, {

    constructor: function(cfg) {

        var config = Ext.apply({}, cfg);
        Portal.details.DataCollectionSelectorPanel.superclass.constructor.call(this, config);

        Ext.MsgBus.subscribe(PORTAL_EVENTS.SELECTED_LAYER_CHANGED, function(eventName, openlayer) {
            this.updateLayerComboBox(openlayer);
        }, this);

        Ext.MsgBus.subscribe(PORTAL_EVENTS.LAYER_REMOVED, function(eventName, openlayer) {
            this.removeFromlayerComboBox(openlayer);
        }, this);
    },

    initComponent: function() {

        this.spacer = new Ext.Spacer({
            height: 10
        });

        this.layerComboBox = new Ext.form.ComboBox({
            width: 320,
            typeAhead: true,
            triggerAction: 'all',
            lazyRender: true,
            mode: 'local',
            store: new Ext.data.ArrayStore({
                id: 0,
                fields: [ 'id', 'layer', 'layerName' ]
            }),
            valueField: 'id',
            editable: false,
            forceSelection: true,
            displayField: 'layerName',
            listeners: {
                select: function(combo, record) {
                    Ext.MsgBus.publish(PORTAL_EVENTS.SELECTED_LAYER_CHANGED,
                        record.data.layer);
                }
            }
        });

        this.items = [ this.spacer, this.layerComboBox ];

        Portal.details.DataCollectionSelectorPanel.superclass.initComponent.call(this);
    },

    updateLayerComboBox: function(layer) {
        if (layer) {
            if (this.layerComboBox.store.find('id', layer.id) == -1) {
                this.addTolayerComboBoxStore(layer);
            }
            this.layerComboBox.setValue(layer.name);
            this.setCursorPosition(this.layerComboBox.el.dom,0); // fixes Chrome bug #1168
        }
    },

    setCursorPosition: function(obj,pos) {
        if(obj != null) {
            if(obj.createTextRange) {
                var range = obj.createTextRange();
                range.move('character', pos);
                range.select();
            }
            else {
                if(obj.selectionStart) {
                    obj.focus();
                    obj.setSelectionRange(pos, pos);
                }
                else
                    obj.focus();
            }
        }
    },

    addTolayerComboBoxStore: function(layer) {
        var layerArray = new Array();
        layerArray['id'] = layer.id;
        layerArray['layerName'] = layer.name;
        layerArray['layer'] = layer;
        this.layerComboBox.store.insert(0, new Ext.data.Record(layerArray));
    },

    removeFromlayerComboBox: function(layer) {
        var index = this.layerComboBox.store.find('id', layer.id);
        if (index != -1) {
            this.layerComboBox.setValue('');
            this.layerComboBox.store.removeAt(index);
        }
    }
});
