package au.org.emii.portal

import java.util.Map;

import grails.test.*
import grails.converters.JSON

class SnapshotControllerTests extends ControllerUnitTestCase 
{
	List<Layer> layers = []
	int numLayers = 5
	
	User owner
	User someOtherUser
	
	protected Map flashMsgParams
	
    protected void setUp() 
	{
        super.setUp()
		
		numLayers.times 
		{
			Layer layer = new Layer()
			layers.add(layer)
		}
		
		mockDomain(Layer, layers)
		layers.each { it.save() }
		
		owner = new User()
		someOtherUser = new User()
		def userList = [owner, someOtherUser]

		mockDomain(User, userList)
		userList.each { it.save() }
		
		mockDomain(Snapshot)
		
		controller.metaClass.message = { Map params -> flashMsgParams = params }
    }

    protected void tearDown() 
	{
        super.tearDown()
    }

    void testSave() 
	{
		def snapshotLayers = [layers[0], layers[2], layers[4]]
		def snapshotName = "SE Australia SST and CPR"
		
		controller.params.layers = snapshotLayers
		controller.params.name = snapshotName
		controller.params.owner = owner
		
		controller.save()
		
		assertEquals("show", controller.redirectArgs.action)
		def snapshotId = controller.redirectArgs.id
		assertNotNull(snapshotId)
		
		def savedSnapshot = Snapshot.get(snapshotId)
		assertNotNull(savedSnapshot)
		
		assertEquals(snapshotLayers.size(), savedSnapshot.layers.size())
		assertEquals(snapshotName, savedSnapshot.name)
		assertEquals(owner, savedSnapshot.owner)
    }
	
	void testShowAsJSON()
	{
		layers[0].name = "Argos 1"
		layers[1].name = "Argos 2"
		
		def snapshotName = "NW argos"
		def snapshotLayers = [layers[0], layers[1]]
			
		def snapshot = new Snapshot(owner: owner, name: snapshotName, layers: snapshotLayers)
		mockDomain(Snapshot, [snapshot])
		snapshot.save()
		
		controller.params.id = snapshot.id
		
		callShow()
		def snapshotAsJson = JSON.parse(controller.response.contentAsString)

		assertEquals(snapshotName, snapshotAsJson.name)
		assertEquals(snapshot.id, snapshotAsJson.id)
		assertEquals(snapshotLayers*.id, snapshotAsJson.layers*.id)
		assertEquals(snapshotLayers*.name, snapshotAsJson.layers*.name)
	}

	void testShowAsJSONError()
	{
		callShow()
		
		assertEquals(404, controller.renderArgs.status)
		assertEquals([code:"default.not.found.message", args:[[code:"snapshot.label", default:"Snapshot"], null]], flashMsgParams)
	}
	
	void testListAsJSON()
	{
		def snapshotsAsJson = createSnapshotsCallListAndParseResult()
		assertEquals(5, snapshotsAsJson.size())
	}

	void testListForOwnerAsJson()
	{
		controller.params.owner = owner
		def snapshotsAsJson = createSnapshotsCallListAndParseResult()
		assertEquals(2, snapshotsAsJson.size())
	}
	
	private def createSnapshotsCallListAndParseResult() 
	{
		def snapshotList = createSnapshots(3, someOtherUser)
		snapshotList += createSnapshots(2, owner)

		callList()

		def snapshotsAsJson = JSON.parse(controller.response.contentAsString)
		return snapshotsAsJson
	}
	
	private def createSnapshots(numSnapshots, theOwner) 
	{
		def snapshotList = []

		numSnapshots.times
		{
			i ->

			def snapshot = new Snapshot(owner: theOwner, name: "snapshot " + i, layers:[layers[i], layers[i + 1]])
			snapshotList += snapshot
		}

		snapshotList.each { it.save() }
		
		return snapshotList
	}
	
	void testDeleteAsJSON()
	{
		
	}
	
	private def callList() 
	{
		controller.params.type = 'JSON'
		controller.list()
	}
	
	private def callShow() 
	{
		controller.params.type = 'JSON'
		controller.show()
	}
}
