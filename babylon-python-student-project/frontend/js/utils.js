function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function loadModel(url, scene) {
    BABYLON.SceneLoader.ImportMesh("", url, "", scene, function (meshes) {
        // Do something with the loaded meshes
    }, null, function (scene, message) {
        console.error("Error loading model: ", message);
    });
}

function createGround(scene, size) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: size, height: size }, scene);
    return ground;
}

function createLight(scene) {
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    return light;
}