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
        resizerRadius: 15
    };



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

    // Set scale number for zoom functionality.
    $scope.zoomHandler = function(zoom) {
        var ctx = document.getElementById('canvas').getContext('2d');
        var scaleToFixed;

        var adjust = function(scale){
            var canvas = document.getElementById('canvas');
            
            var adjustedWidth = $scope.state.backgroundImg.width * scale;
            var adjustedHeight = $scope.state.backgroundImg.height * scale;
            console.log(scale, $scope.state.backgroundImg.width, $scope.state.backgroundImg.height, adjustedWidth, adjustedHeight);
            canvas.width = adjustedWidth;
            canvas.height = adjustedHeight;

        }
        // $scope.state.scale = 1;
        if(zoom === "in") {
            
            $scope.state.scale += 0.1;
            scaleToFixed = Number($scope.state.scale.toFixed(1));
            adjust(scaleToFixed);
            
        } else if(zoom === "out") {
            if ($scope.state.scale > 0.2) { 
                $scope.state.scale -= 0.1;
            }
            
            
            // $scope.state.scale = ($scope.state.scale / 1.1).toFixed(1);
            scaleToFixed = Number($scope.state.scale.toFixed(1));
            adjust(scaleToFixed);
        }
        ctx.scale(scaleToFixed, scaleToFixed);
        $scope.paintCanvas();
        // console.log($scope.state.scale);
        // $scope.state.scale = 1;
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
        console.log(canvas);
    }


    $scope.paintElement = function(canvas, element) {
        var ctx = canvas.getContext('2d');

        elementConfig = element.config;
        switch(element.type){
            case "fillText":
                ctx.textBaseline="bottom"; 
                ctx.font = elementConfig.font;
                ctx.fillStyle = elementConfig.colour;
                ctx.fillText(
                    elementConfig.string,
                    elementConfig.x,
                    elementConfig.y);
                break;
            case "clipArt":
                // Image: turn filename into image.
                let image = new Image();
                image.onload = (function(elementConfig, image) {
                    return function() {

                        //attempt to rotate however when we rotate we need to update co-ord, drag points etc.
                        ctx.save();
                        $scope.rotateCanvas(element, ctx);
                        ctx.drawImage(
                            image,
                            -(elementConfig.width/2),
                            -(elementConfig.height/2),
                            // -(elementConfig.x+(elementConfig.width/2)),
                            // -(elementConfig.y + (elementConfig.height/2)),
                            elementConfig.width,
                            elementConfig.height
                        );
                        // ctx.translate((config.x + (config.width /2)), (config.y+ (config.width /2)));
                        ctx.restore();
                    }
                })(elementConfig, image);
                image.src = elementConfig.filename;

                break;
        }
    }

    // INFO: paintCanvas() must be envoked everytime you add a new layer.
    // Draw backgroundImg and all the layers onto the canvas with scale.
    $scope.paintCanvas = function() {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        $scope.clearCanvas(canvas);
        var scaleToFixed = $scope.state.scale.toFixed(1);
        // ctx.scale(scaleToFixed, scaleToFixed);
        ctx.drawImage($scope.state.backgroundImg,0,0);

        var layers = $scope.state.layers;
        for (var i=0; i < layers.length; i++){
            var element = layers[i];
            $scope.paintElement(canvas, element);
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
                // Layers: from layers option in html
                var canvas = document.getElementById(index+"Layer");
                canvas.style = "background: white;"

                $scope.clearCanvas(canvas);
                $scope.paintElement(canvas, element);
    
            });
        },1500);
        
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
                x: 0,
                y: 0,
                width: 260,
                height: 260,
                // image rotate in degrees
                rotate: 0
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


    // save context before use and restore after use
    // e.g. 
    // ctx.save();
    // $scope.rotateCanvas();
    // ctx.restore();

    $scope.rotateCanvas = function(element, ctx) {
        var elementConfig = element.config;
        // ctx.translate(elementConfig.x, elementConfig.y);
        ctx.translate(elementConfig.x + (elementConfig.width /2), elementConfig.y+ (elementConfig.width /2));
        // ctx.moveTo(0,0);
        ctx.rotate(elementConfig.rotate * (Math.PI / 180));
    }


    // Draw 8 resize points on the element in layers
    $scope.drawResizePoints = function(element) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        
        var x, y, w, h, config = element.config;
        x = config.width/2;
        y = config.height/2;
        w = config.width;
        h = config.height;

        ctx.save();
        $scope.rotateCanvas(element, ctx);


        // 0 top-left
        $scope.drawDragPoint( -(w/2), -(h/2) );
        // 1 top
        $scope.drawDragPoint( 0 , -(h/2) );
        // 2 top-right
        $scope.drawDragPoint( w/2 , -(h/2) );
        // 3 right
        $scope.drawDragPoint( w/2 , 0 );
        // 4 bottom-right
        $scope.drawDragPoint( w/2 , h/2 );
        // 5 bottom
        $scope.drawDragPoint( 0 , h/2 );
        // 6 bottom-left
        $scope.drawDragPoint( -(w/2) , h/2 );
        // 7 left
        $scope.drawDragPoint( -(w/2) , 0 );

        $scope.drawDragPoint( 0, 0 );
        $scope.drawDragPoint( x, y);

    // // 0 top-left
    // $scope.drawDragPoint(x, y);
    // // 1 top
    // $scope.drawDragPoint(x + (w / 2), y);
    // // 2 top-right
    // $scope.drawDragPoint(x + w, y);
    // // 3 right
    // $scope.drawDragPoint(x + w, y + (h /2));
    // // 4 bottom-right
    // $scope.drawDragPoint(x + w, y + h);
    // // 5 bottom
    // $scope.drawDragPoint(x + (w / 2), y + h);
    // // 6 bottom-left
    // $scope.drawDragPoint(x , y + h);
    // // 7 left
    // $scope.drawDragPoint(x, y + (h / 2));

        ctx.restore();
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
        var ctx = canvas.getContext('2d');
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
                
                // ctx.save();
                // $scope.rotateCanvas(layers[$scope.state.clickedItem], ctx);
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

                    // case 0:
                    //     //top-left
                    //     config.x = mx;
                    //     config.width -= dx;
                    //     config.y = my;
                    //     config.height -= dy;
                    //     break;
                    // case 1:
                    //     // top
                    //     config.height -= dy;
                    //     config.y = my;
                    //     break;
                    // case 2:
                    //     // top-right
                    //     config.y = my;
                    //     config.width += dx;
                    //     config.height -= dy;
                    //     break;
                    // case 3:
                    //     // right
                    //     config.width += dx;
                    //     break;
                    // case 4:
                    //     // bottom-right
                    //     config.width = mx - config.x;
                    //     config.height = my - config.y;
                    //     break;
                    // case 5:
                    //     // bottom
                    //     config.height += dy;
                    //     break;
                    // case 6:
                    //     // bottom-left
                    //     config.x = mx;
                    //     config.width -= dx;
                    //     config.height += dy;
                    //     break;
                    // case 7:
                    //     // bottom-left
                    //     config.x += dx;
                    //     config.width -= dx;
                    //     break;
                    
                }
            }
            // ctx.restore();
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


        console.log(layers[$scope.state.clickedItem].config);
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