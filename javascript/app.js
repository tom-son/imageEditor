var editApp = angular.module('editApp', []);

editApp.controller('mainController', ['$scope',
function($scope){
    $scope.state = {
        backgroundImg: null,
        showTools: {

        },
        layers: [{type: 'fillText', config: {string: "Hello world", x: 60, y: 60, width:150, height:35}},
                    {type: 'fillText', config: {string: "Hello world", x: 60, y: 60, width:150, height:35}}],
        dragOk: false,
        startX: 0,
        startY: 0,
        // Set to the item that was clicked otherwise -1.
        clickedItem: -1,
    };

    // Event handle which will be attached to onchange event 
    // listener of "choose file" (import) button.
    $scope.importImg = function(event) {
        var file = document.getElementById("imgFile").files[0];
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        // FileReader to read the image.
        var fr = new FileReader();
        // Image to get meta data on image such as size.
        var image = new Image();

        fr.onload = function(event) {
            image.onload = function(event) {
                // store background image into state.
                $scope.state.backgroundImg = image;
                $scope.setDimension(document.getElementById("canvas"));
                $scope.paintCanvas();
            }
            image.src = event.target.result;
        }
        fr.readAsDataURL(file);  
    }    

    // Clear canvas to removing all canvas drawing.
    $scope.clearCanvas = function(canvas) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Set the canvas width and height to image width and height.
    $scope.setDimension = function(canvas) {
        var image = $scope.state.backgroundImg;
        canvas.width = image.width;
        canvas.height = image.height;
        console.log("width: ", image.width, ", height: ", image.height);
    }

    // INFO: paintCanvas() must be envoked everytime you add a new layer.
    // Draw all the layers onto the canvas.
    $scope.paintCanvas = function() {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        $scope.clearCanvas(document.getElementById("canvas"));
        
        ctx.drawImage($scope.state.backgroundImg,0,0);

        var layers = $scope.state.layers;
        for (var i=0; i < layers.length; i++){
            switch(layers[i].type){
                case "fillText":
                    var config = layers[i].config;
                    ctx.font = "30px Arial";
                    ctx.fillText(
                        config.string,
                        config.x,
                        config.y);
                    break;
            }
        }
    }

    // Mouse click event handler to check if mouse click co-ord
    // is within item co-ord in the config.
    $scope.mouseDown = function(event) {
        event.preventDefault();
        event.stopPropagation();
        var canvas = document.getElementById("canvas");
        var borderBox = canvas.getBoundingClientRect();
        var offsetX = borderBox.left;
        var offsetY = borderBox.top;
        var layers = $scope.state.layers;

        // Get the current mouse position.
        var mx = parseInt(event.clientX - offsetX);
        var my = parseInt(event.clientY - offsetY);

        // Test each shape to see if mouse is inside.
        $scope.state.dragOk = false;
        for (var i=0; i<layers.length; i++){
            var item = layers[i];
            // Test if the mouse is inside this rect.
            if (item.config.width){
                switch (item.type){
                    case "fillText":
                        //        |
                        // (x,y) .|________
                        if (mx > item.config.x 
                            && mx < item.config.x + item.config.width 
                            && my < item.config.y 
                            && my > item.config.y - item.config.height) {
                            // If yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            $scope.state.clickedItem = i;
                            // item.isDragging = true;
                    }
                        break;
                    case "drawImage":
                        //  (x,y) .______
                        //         |
                        //         |
                        if (mx > item.config.x 
                            && mx < item.config.x + item.config.width 
                            && my > item.config.y 
                            && my < item.config.y + item.config.height) {
                            // Ff yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            // item.isDragging = true;
                        }
                        break;
                }
                
            } 
        }
        // Save the current mouse position for mouseMove
        $scope.state.startX = mx;
        $scope.state.startY = my;
    }

    // Mouse click release handler to reset all dragging flags in layers array.
    $scope.mouseUp = function(event) {
        event.preventDefault();
        event.stopPropagation();

        var layers = $scope.state.layers;

        // Clear all the dragging flags.
        $scope.state.dragOk = false;
        for (var i=0; i<layers.length; i++) {
            layers[i].isDragging=false;
        }
    }
    // Mouse move event handler to move items co-ord in layers array.
    $scope.mouseMove = function(event) {
        var canvas = document.getElementById("canvas");
        var borderBox = canvas.getBoundingClientRect();
        var offsetX = borderBox.left;
        var offsetY = borderBox.top;
        var layers = $scope.state.layers;

        // If we're dragging anything...
        if ($scope.state.dragOk){
            // Tell the browser we're handling this mouse event.
            event.preventDefault();
            event.stopPropagation();

            // Get the current mouse position.
            var mx = parseInt(event.clientX-offsetX);
            var my = parseInt(event.clientY-offsetY);

            // Calculate the distance the mouse has moved
            // since the last mousemove.
            var dx = mx - $scope.state.startX;
            var dy = my - $scope.state.startY;

            // Move each rect that isDragging 
            // by the distance the mouse has moved
            // since the last mousemove.
            // for(var i=0; i<layers.length; i++){
            //     var item = layers[i];
            //     if(item.isDragging){
            //         item.config.x+=dx;
            //         item.config.y+=dy;
            //     }
            // }
            var item = $scope.state.clickedItem;
            if ($scope.state.clickedItem >= 0) {
                layers[item].config.x+=dx;
                layers[item].config.y+=dy;
            }

            // Redraw the scene with the new rect positions.
            $scope.paintCanvas();

            // Reset the starting mouse position for the next mousemove.
            $scope.state.startX = mx;
            $scope.state.startY = my;


        }
    }

    // Set the canvas mouse listeners to our handlers.
    $scope.setCanvasListeners = function(canvas) {
        canvas.onmousedown = $scope.mouseDown;
        canvas.onmouseup = $scope.mouseUp;
        canvas.onmousemove = $scope.mouseMove;
    }





    // After all above functions are declared envoke these.
    $scope.setCanvasListeners(document.getElementById("canvas"));
}]);



















// dragController is responsible for:
// - Dragging controller and toolbar window around the screen.
// - Hide the controller and toolbar window.
// - Display the controller and toolbar window with 
//      hotkey: mac: 'command + s' window: 'window + s'

editApp.controller('dragController', ['$scope',
function($scope){
    //Make the DIV element draggagle:
    $scope.dragElement = function(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        if (document.getElementById(elmnt.id + "header")) {
            /* if present, the header is where you move the DIV from:*/
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        } else {
            /* otherwise, move the DIV from anywhere inside the DIV:*/
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {

            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    $scope.dragElement(document.getElementById(("controller")));
    $scope.dragElement(document.getElementById(("toolbar")));
    
    $scope.minimise = function(id) {
        alert("Alert: Window will disappear press 'command + s' or 'window + s' to display again!");
        document.getElementById(id).style.display =  "none";

    }

    $scope.show = function(e) {
        if (e.ctrlKey && e.keyCode == 83) {
            document.getElementById('toolbar').style.display = "block";
            document.getElementById('controller').style.display = "block";
        }
    }

    document.addEventListener('keyup', $scope.show, false);
}]);