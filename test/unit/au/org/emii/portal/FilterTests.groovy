
/*
 * Copyright 2012 IMOS
 *
 * The AODN/IMOS Portal is distributed under the terms of the GNU General Public License
 *
 */

package au.org.emii.portal

import grails.test.GrailsUnitTestCase

class FilterTests extends GrailsUnitTestCase {

    protected void setUp() {
        super.setUp()
    }

    protected void tearDown() {
        super.tearDown()
    }

    void testToJSON(){
        def server1 = new Server()
        server1.id = 1

        def layer1 = new Layer()
        layer1.id = 3
        layer1.server = server1

        def filter1 = new Filter(name: "vesselName", type: FilterTypes.String, label: "Vessel Name", possibleValues: ["ship1", "ship2", "ship3"], layer: layer1)

        def expected = [:]
        expected["label"] = "Vessel Name"
        expected["type"] = FilterTypes.String
        expected["name"] = "vesselName"
        expected["possibleValues"] = ["ship1", "ship2", "ship3"]
        expected["layerId"] = 3

        println "expected"
        println(expected)

        println "generated"
        println filter1.toLayerData().toString()

        assertEquals filter1.toLayerData().toString(), expected.toString()
    }
}
