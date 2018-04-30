var editApp = angular.module('editApp', []);

editApp.controller('mainController', ['$scope', '$http',
function($scope, $http){
    $scope.state = {
        textString: "",
        fontSize: 12,
        font: "",
        fontColor: "",
        fonts: [
            "Arial",
            "Serif"
        ],
        backgroundImg: null,
        showTools: {

        },
        layers: [],
        clipArt: [
            "heart-clipart.png",
            "https://www.shareicon.net/data/128x128/2017/04/04/882436_media_512x512.png"
        ],
        scale: 1,
        dragOk: false,
        startX: 0,
        startY: 0,
        // Set to the item that was clicked otherwise -1.
        clickedItem: -1,
        resizePoint: -1,
        resizerRadius: 5
    };


    $scope.clickMe = function() 
    {
        console.log("Clicked");
        var data = 1;
        $http.post('http://121.44.70.213:81/textEditor/jsonSave.php', data, null)
            .then(function(){

            });
    }



    // Event handle which w ill be attached to onchange event 
    // listener of "choose file" (import) button.
    $scope.importImg = function(event) {
        console.log("importimg clicked")
        var file = document.getElementById("imgFile").files[0];
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
    $scope.clearCanvas = function() {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Set the canvas width and height to image width and height.
    $scope.setDimension = function(canvas) {
        var image = $scope.state.backgroundImg;
        canvas.width = image.width;
        canvas.height = image.height;
        console.log("width: ", image.width, ", height: ", image.height);
        console.log(canvas);
    }

    // INFO: paintCanvas() must be envoked everytime you add a new layer.
    // Draw all the layers onto the canvas.
    $scope.paintCanvas = function() {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        $scope.clearCanvas();
        ctx.scale($scope.state.scale, $scope.state.scale);
        ctx.drawImage($scope.state.backgroundImg,0,0);

        var layers = $scope.state.layers;
        for (var i=0; i < layers.length; i++){
            var config = layers[i].config;
            switch(layers[i].type){
                case "fillText":
                    ctx.textBaseline="bottom"; 
                    ctx.font = config.font;
                    ctx.fillStyle = config.colour;
                    ctx.fillText(
                        config.string,
                        config.x,
                        config.y);
                    break;
                case "clipArt":
                    // Image: turn filename into image.
                    let image = new Image();
                    image.onload = (function(config, image) {
                        return function() {

                            //attempt to rotate however when we rotate we need to update co-ord, drag points etc.
                            ctx.save();
                            ctx.translate(config.x + (config.width /2), config.y+ (config.width /2));
                            ctx.moveTo(0,0);
                            ctx.rotate(config.rotate * (Math.PI / 180));
                            ctx.drawImage(
                                image,
                                -(config.x+(config.width/2)),
                                -(config.y + (config.height/2)),
                                config.width,
                                config.height
                            );
                            // ctx.translate((config.x + (config.width /2)), (config.y+ (config.width /2)));
                            ctx.restore();
                        }
                    })(config, image);
                    image.src = config.filename;

                    break;
            }
        }


        // when something is clicked check if element was clicked and if so draw points
        if($scope.state.clickedItem > -1) {
            $scope.drawResizePoints($scope.state.layers[$scope.state.clickedItem]);
        }
    }



    // Paint the layers in controller section.
    $scope.paintLayers = function() {
        setTimeout(function() {
            $scope.state.layers.forEach(function(element, index) {
                var id = index + "Layer";

    
    
                var canvas = document.getElementById(index+"Layer");
                canvas.style ="background: white;"
                var ctx = canvas.getContext("2d");
                var config = element.config;

                switch(element.type){
                    
                    case "fillText":
                        
                        ctx.font = config.font;
                        ctx.fillStyle = config.colour;
                        ctx.fillText(
                            config.string,
                            config.x,
                            config.y);
                        break;
                    case "clipArt":
                        // Image to get meta data on image such as size.
                        var image = new Image();
                        image.onload = function(event) {
                            // store image into layers.
                            ctx.drawImage(
                                image,
                                config.x,
                                config.y
                            );
                        }
                        image.src = config.filename;
                        break;
                }
    
            });
        },1500);
        
    }

    // Set scale number for zoom functionality.
    $scope.zoomHandler = function(zoom) {

        $scope.state.scale = 1;
        if(zoom === "in") {
            $scope.state.scale = ($scope.state.scale * 1.1).toFixed(1);
        } else if(zoom === "out") {

            $scope.state.scale = ($scope.state.scale / 1.1).toFixed(1);
        }
        $scope.paintCanvas();
        console.log($scope.state.scale);
        $scope.state.scale = 1;
    }


    $scope.addTextHandler = function(xpos, ypos) {
        $scope.state.layers.push({
            type: "fillText",
            config: {
                string: $scope.state.textString,
                x: xpos,
                y: ypos,
                font: $scope.state.fontSize + "px " + $scope.state.font,
                colour: $scope.state.fontColor,
                width: 100,
                height: 50
            }
        });
        $scope.paintCanvas();
        $scope.setDefaultValues();
    }

    
    $scope.addClipArtHandler = function(filename) {
        console.log(filename);
        // store image into layers.
        $scope.state.layers.push({
            type: "clipArt",
            config: {
                filename: filename,
                x: 20,
                y: 20,
                width: 260,
                height: 260,
                // image rotate in degrees
                rotate: 360
            }
        });
        $scope.paintCanvas();
    }

    $scope.addImageHandler = function(event) {
        var file = document.getElementById("addImgFile").files[0];
        // FileReader to read the image.
        var fr = new FileReader();
        // Image to get meta data on image such as size.
        var image = new Image();

        fr.onload = function(event) {
            image.onload = function(event) {
                // store image into layers.
                $scope.state.layers.push({
                    type: "drawImage",
                    config: {
                                                                   // What to do with image and where to store it.
                    }
                });
                $scope.paintCanvas();
            }
            image.src = event.target.result;
        }
        fr.readAsDataURL(file);  
        
    }

    $scope.addRotateHandler = function(degrees) {
        if($scope.state.clickedItem > -1) {
            $scope.state.layers[$scope.state.clickedItem].config.rotate += degrees;
        }
        $scope.paintCanvas();
    }



    // Set nessesary values in scope to default. 
    $scope.setDefaultValues = function() {
        $scope.state.textString = "";
        $scope.state.fontSize = 12;
    }

   


    $scope.updateFont = function() {
        console.log($scope.state.font);
        console.log($scope.state.fontColor);
    }



      // Draw 8 resize points on the element in layers
      $scope.drawResizePoints = function(element) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        
        var x, y, w, h, config = element.config;
        x = config.x;
        y = config.y;
        w = config.width;
        h = config.height;

        
        // 0 top-left
        $scope.drawDragPoint(x, y);
        // 1 top
        $scope.drawDragPoint(x + (w / 2), y);
        // 2 top-right
        $scope.drawDragPoint(x + w, y);
        // 3 right
        $scope.drawDragPoint(x + w, y + (h /2));
        // 4 bottom-right
        $scope.drawDragPoint(x + w, y + h);
        // 5 bottom
        $scope.drawDragPoint(x + (w / 2), y + h);
        // 6 bottom-left
        $scope.drawDragPoint(x , y + h);
        // 7 left
        $scope.drawDragPoint(x, y + (h / 2));
    }

    $scope.drawDragPoint = function(x, y) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.arc(x, y, $scope.state.resizerRadius, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }
    
  
    $scope.itemsHitTest = function(mx, my) {
        console.log("elementHitTest()");
        var layers = $scope.state.layers;
        for (var i=0; i<layers.length; i++){
            var item = layers[i];
            // Test if the mouse is inside this rect.
            if (item.config.width){
                switch (item.type){
                    case "fillText":
                        if (mx > item.config.x 
                            && mx < item.config.x + item.config.width 
                            && my < item.config.y 
                            && my > item.config.y - item.config.height) {
                            // If yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            item.isDragging = true;
                            return i;
                        }
                        break;
                    case "drawImage":
                        if (mx > item.config.x 
                            && mx < item.config.x + item.config.width 
                            && my > item.config.y 
                            && my < item.config.y + item.config.height) {
                            // Ff yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            item.isDragging = true;
                            return i;
                        }
                        break;
                    case "clipArt":
                        if (mx > item.config.x 
                            && mx < item.config.x + item.config.width 
                            && my > item.config.y 
                            && my < item.config.y + item.config.height) {
                            // Ff yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            item.isDragging = true;
                            return i;
                        }
                        break;
                }
            } 
        }
        return -1;
    }


    $scope.pointsHitTest = function(mx, my, clickedItem) {
        var dx, dy, resizerRadius2 = $scope.state.resizerRadius * $scope.state.resizerRadius;
        var config = $scope.state.layers[clickedItem].config;
        // top-left
        dx = mx - config.x;
        dy = my - config.y;
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (0);
        }
        // top
        dx = mx - ( config.x + (config.width / 2) );
        dy = my - ( config.y)
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (1);
        }
        // top-right
        dx = mx - (config.x + config.width);
        dy = my - config.y;
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (2);
        }
        // right
        dx = mx - (config.x + config.width);
        dy = my - ( config.y + (config.height / 2) );
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (3);
        }
        // bottom-right
        dx = mx - (config.x + config.width);
        dy = my - (config.y + config.height);
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (4);
        }
        // bottom
        dx = mx - ( config.x + (config.width / 2) );
        dy = my - (config.y + config.height);
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (5);
        }
        // bottom-left
        dx = mx - config.x;
        dy = my - (config.y + config.height);
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (6);
        }
        // left
        dx = mx - config.x;
        dy = my - (config.y + (config.height / 2) );
        if (dx * dx + dy * dy <= resizerRadius2) {
            return (7);
        }
        return (-1);
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
        // reset items
        $scope.state.dragOk = false;

        $scope.state.clickedItem = $scope.itemsHitTest(mx, my);
        if($scope.state.clickedItem > -1) {
            $scope.state.resizePoint = $scope.pointsHitTest(mx, my, $scope.state.clickedItem);
        }
        console.log("clickedItem", $scope.state.clickedItem,"resizePint",$scope.state.resizePoint);



        // Always paint to add and remove the drag points.
        $scope.paintCanvas();

        // Save the current mouse position for mouseMove
        $scope.state.startX = mx;
        $scope.state.startY = my;

    }

    // Mouse move event handler to move items co-ord in layers array.
    $scope.mouseMove = function(event) {
        var canvas = document.getElementById("canvas");
        var borderBox = canvas.getBoundingClientRect();
        var offsetX = borderBox.left;
        var offsetY = borderBox.top;
        var layers = $scope.state.layers;

         // Get the current mouse position.
        var mx = parseInt(event.clientX-offsetX);
        var my = parseInt(event.clientY-offsetY);

        // Calculate the distance the mouse has moved
        // since the last mousemove.
        var dx = mx - $scope.state.startX;
        var dy = my - $scope.state.startY;

        // If we're dragging anything...
        if ($scope.state.dragOk){
            // Tell the browser we're handling this mouse event.
            event.preventDefault();
            event.stopPropagation();

           

            

            // console.log(mx, my);
            // console.log(dx, dy);



            // Move each rect that isDragging 
            // by the distance the mouse has moved
            // since the last mousemove.
            // for(var i=0; i<layers.length; i++){
            //     var item = layers[$scope.state.clickedItem];
            //     if(item.isDragging){
            //         item.config.x+=dx;
            //         item.config.y+=dy;
            //     }
            // }

            if ($scope.state.clickedItem > -1
                && $scope.state.resizePoint === -1){
                var item = layers[$scope.state.clickedItem];
                item.config.x+=dx;
                item.config.y+=dy;
            }



            // if a item and points are selected resize
            if ($scope.state.clickedItem > -1
                && $scope.state.resizePoint > -1) {
                
                var config = $scope.state.layers[$scope.state.clickedItem].config;
                // resize the image
                switch ($scope.state.resizePoint) {
                    case 0:
                        //top-left
                        config.x = mx;
                        config.width -= dx;
                        config.y = my;
                        config.height -= dy;
                        break;
                    case 1:
                        // top
                        config.height -= dy;
                        config.y = my;
                        break;
                    case 2:
                        // top-right
                        config.y = my;
                        config.width += dx;
                        config.height -= dy;
                        break;
                    case 3:
                        // right
                        config.width += dx;
                        break;
                    case 4:
                        // bottom-right
                        config.width = mx - config.x;
                        config.height = my - config.y;
                        break;
                    case 5:
                        // bottom
                        config.height += dy;
                        break;
                    case 6:
                        // bottom-left
                        config.x = mx;
                        config.width -= dx;
                        config.height += dy;
                        break;
                    case 7:
                        // bottom-left
                        config.x += dx;
                        config.width -= dx;
                        break;
                }
            }

            // Redraw the scene with the new rect positions.
            $scope.paintCanvas();

            // Reset the starting mouse position for the next mousemove.
            $scope.state.startX = mx;
            $scope.state.startY = my;


        }
        
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

        // Temparary position for testing
        // was used in paint canvas however might not be good there
        // as it paints way too many time.
        $scope.paintLayers();
    }
    

    // Set the canvas mouse listeners to our handlers.
    $scope.setCanvasListeners = function() {
        var canvas = document.getElementById("canvas");
        canvas.onmousedown = $scope.mouseDown;
        canvas.onmouseup = $scope.mouseUp;
        canvas.onmousemove = $scope.mouseMove;
    }





    // After all above functions are declared envoke these.
    $scope.setCanvasListeners();
}]);



















// dragController is responsible for:
// - Dragging controller and toolbar window around the screen.
// - Hide the controller and toolbar window.
// - Display the controller and toolbar window with 
//      hotkey: mac: 'command + s' window: 'window + s'

editApp.controller('dragController', ['$scope',
function($scope){
    $scope.showControllers = {
        // Layers: false,
        Text: false,
        Image: false,
        "Clip Art": false
    };


    // Event handler to open the correct tool edit feature
    // Sets all element in showTools to false. Then turns
    // correct tool to true to display.
    $scope.openController = function(controllerName) {
        for(let controller in $scope.showControllers) {
            $scope.showControllers[controller] = false;
        }
        $scope.showControllers[controllerName] = true;
        console.log($scope.showControllers);
    };


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

    

    $scope.minimise = function(id) {
        console.log(id);
        document.getElementById(id).style.display =  "none";
        alert("Alert: To display controller again press 'control + s'")

    }

    $scope.show = function(e) {
        if (e.ctrlKey && e.keyCode == 83) {
            document.getElementById('controller').style.display = "block";
            document.getElementById('layers').style.display = "block";
        }
    }

    document.addEventListener('keyup', $scope.show, false);
    
    $scope.dragElement(document.getElementById(("controller")));
    $scope.dragElement(document.getElementById(("layers")));
}]);