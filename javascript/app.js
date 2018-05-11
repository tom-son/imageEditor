var editApp = angular.module('editApp', ['ngRoute']);

editApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/home', {
        templateUrl: 'partials/home.html',
        controller: 'HomeController'
    })
    .when('/editor', {
        templateUrl: 'partials/editor.html',
        controller: 'mainController'
    })
    .otherwise({redirectTo: '/home'});
}]);



editApp.controller('mainController', ['$scope', '$http', '$routeParams',
function($scope, $http, $routeParams){
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
        historyLayers: [],
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
        resizerRadius: 15,
        crop: -1,

        // Testing for route
        type: $routeParams.type,
        w: $routeParams.width,
        h: $routeParams.height
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
                    // elementConfig.x,
                    // elementConfig.y
                    -(elementConfig.width/2),
                    -(elementConfig.height/2)
                );
                break;
            case "drawImage":
                // Image: turn filename into image.
                let image = new Image();
                image.onload = (function(elementConfig, image, cropConfig) {
                    return function() {

                        //attempt to rotate however when we rotate we need to update co-ord, drag points etc.
                        ctx.save();
                        $scope.rotateCanvas(element, ctx);
                        ctx.drawImage(
                            // Below only implements image with rotate however other one!                            

                            // image,
                            // -(elementConfig.width/2),
                            // -(elementConfig.height/2),
                            // // -(elementConfig.x+(elementConfig.width/2)),
                            // // -(elementConfig.y + (elementConfig.height/2)),
                            // elementConfig.width,
                            // elementConfig.height,

                            // Trying to implement image with rotate and crop
                            image,
                            cropConfig.x,
                            cropConfig.y,
                            cropConfig.width,
                            cropConfig.height,
                            -(elementConfig.width/2),
                            -(elementConfig.height/2),
                            elementConfig.width,
                            elementConfig.height,
                        );
                        // ctx.translate((config.x + (config.width /2)), (config.y+ (config.width /2)));
                        ctx.restore();
                    }
                })(elementConfig, image, element.cropConfig);
                image.src = elementConfig.image;

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
        if($scope.state.backgroundImg !== null) {
            ctx.drawImage($scope.state.backgroundImg,0,0);
        }
        

        var layers = $scope.state.layers;
        for (var i=0; i < layers.length; i++){
            var element = layers[i];
            ctx.save();
            $scope.rotateCanvas(element, ctx);
            $scope.paintElement(canvas, element);
            ctx.restore();
        }

        // when something is clicked check if element was clicked and if so draw points
        ctx.save();
        $scope.rotateCanvas(layers[$scope.state.clickedItem], ctx);

        if($scope.state.clickedItem > -1 
            // && $scope.state.crop === -1
        ) {

            $scope.drawResizePoints($scope.state.layers[$scope.state.clickedItem].config);
            var config = $scope.state.layers[$scope.state.clickedItem].config;            
            $scope.drawDragPoint( config.x, config.y);
            // $scope.drawDragPoint(config.x+(config.width/2),config.y+(config.height/2));

            // else if Item is clicked and crop is selected
        } 
        // else if ($scope.state.clickedItem > -1 
        //             && $scope.state.crop > -1) {
        //     $scope.drawResizePoints($scope.state.layers[$scope.state.clickedItem].cropConfig);
        // }
        ctx.restore();
    }



    // Paint the layers in controller section.
    $scope.paintLayers = function() {
        setTimeout(function() {
            $scope.state.layers.forEach(function(element, index) {
                // Layers: from layers option in html
                var mainCanvas = document.getElementById('canvas');
                var layerCanvas = document.getElementById(index+"Layer");
                var ctx = layerCanvas.getContext('2d');
                layerCanvas.style = "background: white;"

                var isWidthGreater;
                var aspectRatio = mainCanvas.width / mainCanvas.height;

                mainCanvas.width > mainCanvas.height
                ? isWidthGreater = true
                : isWidthGreater = false;

                // Set up the correct ratio for the layers display
                if (isWidthGreater) {
                    layerCanvas.width = 130;
                    layerCanvas.height = 130 / aspectRatio;
                } else {
                    layerCanvas.height = 100;
                    layerCanvas.width = 100 * aspectRatio;
                }

                var scaleWidth = $scope.getScale('small', mainCanvas.width, layerCanvas.width);
                var scaleHeight = $scope.getScale('small', mainCanvas.height, layerCanvas.height);

                ctx.scale(scaleWidth, scaleHeight);

                $scope.clearCanvas(layerCanvas);
                $scope.paintElement(layerCanvas, element);
    
            });
        },1500);
    }

    $scope.paintClipArt = function() {

    }

    $scope.getScale = function(type, originalLength, adjustedLength) {
        if(type === 'small') {
            return adjustedLength / originalLength;
        } else if ( type === ' large') {
            return originalLength / adjustedLength;
        }
        // type didn't match getScale failed!
        console.log("getScale failed! Type doesn't match");
        return -1;
    }



    $scope.addTextHandler = function(xpos, ypos) {
        var ctx = document.getElementById('canvas').getContext('2d');
        ctx.font = $scope.state.fontSize + "px " + $scope.state.font;

        var stringWidth =  ctx.measureText($scope.state.textString).width;

        $scope.state.layers.push({
            type: "fillText",
            config: {
                string: $scope.state.textString,
                x: xpos,
                y: ypos,
                font: $scope.state.fontSize + "px " + $scope.state.font,
                colour: $scope.state.fontColor,
                width: stringWidth,
                height: 50
            }
        });
        $scope.state.historyLayers = [];
        $scope.paintCanvas();
        $scope.setDefaultValues();
    }

    
    $scope.addClipArtHandler = function(filename) {
        // store image into layers.
        $scope.state.layers.push({
            type: "drawImage",
            config: {
                image: filename,
                // configuration of image for drawImage
                x: 0,
                y: 0,
                width: 260,
                height: 260,
                // image rotate in degrees
                rotate: 0
            },
            // configuration for crop for drawImage
            cropConfig: {
                x: 0,
                y: 0,
                width: 260,
                height: 260
            }
        });
        $scope.state.historyLayers = [];
        $scope.paintCanvas();
    }


    $scope.addImageHandler = function(event) {
        var file = document.getElementById("addImgFile").files[0];
        // FileReader to read the image.
        var fr = new FileReader();
        // Image to get meta data on image such as size.
        var image = new Image();

        fr.onload = function(event) {
            console.log(fr.result);
            image.onload = function(event) {
                // store image into layers.
                $scope.state.layers.push({
                    type: "drawImage",
                    config: {
                         image: fr.result,
                         x: 0,
                         y: 0,
                         width: image.width,
                         height: image.height,
                         rotate: 0
                    },
                    cropConfig: {
                        x: 0,
                        y: 0,
                        width: image.width,
                        height: image.height
                    }
                });
                console.log($scope.state.layers);
                $scope.state.historyLayers = [];
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
        $scope.state.historyLayers = [];
        $scope.paintCanvas();
    }

    $scope.cropHandler = function() {
        if($scope.state.clickedItem > -1) {
            $scope.state.crop = $scope.state.clickedItem;
        }
        console.log($scope.state.crop);

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
        ctx.translate(elementConfig.x + (elementConfig.width /2), elementConfig.y + (elementConfig.height /2));
        // ctx.moveTo(0,0);
        ctx.rotate(elementConfig.rotate * (Math.PI / 180));
    }

    // Draw 8 resize points on the element in layers
    $scope.drawResizePoints = function(config) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        
        var x, y, w, h;
        x = config.x;
        y = config.y;
        w = config.width;
        h = config.height;


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

       
    }

    $scope.drawDragPoint = function(x, y) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.arc(x, y, $scope.state.resizerRadius, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }

    // Updates the item z-index by removing clicked item
    // to the end of layers array. Where the end of layers
    // array has the highest priority.

    // You should update the itemClicked after using this function
    // as itemClicked is not the last element in array
    $scope.updateZIndex = function(layers, itemClicked) {
        var removed = layers.splice(itemClicked, 1);
        layers.push(removed[0]);
    }
    
  
    $scope.itemsHitTest = function(mx, my) {
        var layers = $scope.state.layers;
        for (var i=layers.length -1; i>=0; i--){
            var item = layers[i];
            var scaleX = item.config.x * $scope.state.scale;
            var scaleY = item.config.y * $scope.state.scale;
            var scaleW = item.config.width * $scope.state.scale;
            var scaleH = item.config.height * $scope.state.scale;



            // Test if the mouse is inside this rect.
            if (item.config.width){
                switch (item.type){
                    case "fillText":
                        if (mx > scaleX 
                            && mx < scaleX + scaleW 
                            && my < scaleY 
                            && my > scaleY - scaleH) {
                            // If yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            item.isDragging = true;
                            return i;
                        }
                        break;
                    case "drawImage":
                        if (mx > scaleX 
                            && mx < scaleX + scaleW 
                            && my > scaleY 
                            && my < scaleY + scaleH) {
                            // Ff yes, set that rects isDragging = true 
                            $scope.state.dragOk = true;
                            item.isDragging = true;
                            return i;
                        }
                        break;
                    // case "clipArt":
                    //     if (mx > item.config.x 
                    //         && mx < item.config.x + item.config.width 
                    //         && my > item.config.y 
                    //         && my < item.config.y + item.config.height) {
                    //         // Ff yes, set that rects isDragging = true 
                    //         $scope.state.dragOk = true;
                    //         item.isDragging = true;
                    //         return i;
                    //     }
                    //     break;
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
    
    // Resize the config depending on which resizePoint.
    $scope.resizeItem = function(config, resizePoint, mx, my, dx, dy) {
        // var config = $scope.state.layers[$scope.state.clickedItem].config;
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
                config.height = dx;
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
        if($scope.state.historyLayers.length > 0) {
            $scope.state.historyLayers = [];
        }
       
    }

    // Handler to add keyboard functionality to element string.

    // WARNING: Only lower and uppercase letters as well as backspace works!
    $scope.updateTextHandler = function(e, element) {
        console.log(e, element);

        if (e.keyCode!=16){ // If the pressed key is anything other than SHIFT
            if (e.keyCode >= 65 && e.keyCode <= 90){ // If the key is a letter
                if (e.shiftKey){ // If SHIFT key is down, capital letter
                    element.config.string += e.key;
                } else { // else lowecase letter
                    element.config.string += e.key;
                }
            } else if (e.keyCode === 8){ // If BACKSPACE key remove last letter in string
                element.config.string = element.config.string.slice(0, -1);
            } else {
                console.log("ASCII Code (non-letter): "+String.fromCharCode(e.keyCode));
            }
      }
    }


    // Mouse click event handler to check if mouse click co-ord
    // is within item co-ord in the config.
    $scope.mouseDown = function(event) {
        event.preventDefault();
        event.stopPropagation();

        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext('2d');


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
            $scope.updateZIndex(layers, $scope.state.clickedItem);
            // Update clickedItem to highest priority which is the last
            // element in the array.
            $scope.state.clickedItem = layers.length - 1;
            $scope.state.resizePoint = $scope.pointsHitTest(mx, my, $scope.state.clickedItem);
            if($scope.state.layers[$scope.state.clickedItem].type === "fillText") {
                document.addEventListener("keydown", (function(event) {
                    $scope.updateTextHandler(event, $scope.state.layers[$scope.state.clickedItem]);
                    $scope.paintCanvas();

                }) , false);
            }
        }

        // temp - testing for crop functionality. Turn off crop when no item are selected.
        if($scope.state.clickedItem === -1) {
            $scope.state.crop = -1;
        }

        console.log("clickedItem: " + $scope.state.clickedItem,"resizePint: " + $scope.state.resizePoint,"crop: " + $scope.state.crop);

    

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

        var layers = $scope.state.layers;
        
        var borderBox = canvas.getBoundingClientRect();
        var offsetX = borderBox.left;
        var offsetY = borderBox.top;
        
         // Get the current mouse position.
        var mx = parseInt(event.clientX-offsetX);
        var my = parseInt(event.clientY-offsetY);

        // Calculate the distance the mouse has moved
        // since the last mousemove.
        var dx = mx - $scope.state.startX;
        var dy = my - $scope.state.startY;

        // If we're dragging anything...
        if ($scope.state.dragOk){
            // ctx.save();
            // $scope.rotateCanvas(layers[$scope.state.clickedItem], ctx);
            // Tell the browser we're handling this mouse event.
            event.preventDefault();
            event.stopPropagation();

            if ($scope.state.clickedItem > -1
                && $scope.state.resizePoint === -1){
                var item = layers[$scope.state.clickedItem];
                item.config.x+=dx;
                item.config.y+=dy;
                $scope.state.historyLayers = [];
            }

            // if an item and resizePoints are selected and !crop then resize
            if ($scope.state.clickedItem > -1
                && $scope.state.resizePoint > -1
                && $scope.state.crop === -1) {
                $scope.resizeItem(layers[$scope.state.clickedItem].config, $scope.state.resizePoint, mx, my, dx, dy);
                // if an item and resizePoints are selected and crop then crop
            } else if($scope.state.clickedItem > -1
                && $scope.state.resizePoint > -1
                && $scope.state.crop >-1) {
                    $scope.resizeItem(layers[$scope.state.clickedItem].config, $scope.state.resizePoint, mx, my, dx, dy);
                    $scope.resizeItem(layers[$scope.state.clickedItem].cropConfig, $scope.state.resizePoint, mx, my, dx, dy);
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

        // Reset values
        // Exit crop when mouse is released
        $scope.state.crop = -1;


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



    // ------- undo and redo functions
    $scope.popLayerTo = function(fromLayers, toLayers) {
        console.log(fromLayers, toLayers);
        var lastElement = fromLayers.pop();
        console.log(lastElement);
        toLayers.push(lastElement);
        console.log("After push", fromLayers, toLayers);
        $scope.paintCanvas();
    }




    // ------- Page set up settings ---------

    $scope.createBlankHandler = function(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
    }


    $scope.onInit = function() {
        var canvas = document.getElementById('canvas');
        switch($scope.state.type) {
            case 'createBlankCanvas':
                $scope.createBlankHandler(canvas, $scope.state.w, $scope.state.h);
                break;
        }
    }

    // After all above functions are declared envoke these.
    $scope.setCanvasListeners();

    // Initialise canvas
    $scope.onInit();
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
            console.log(e);
            document.getElementById('controller').style.display = "block";
            document.getElementById('layers').style.display = "block";
        }
    }

    document.addEventListener('keyup', $scope.show, false);
    
    $scope.dragElement(document.getElementById(("controller")));
    $scope.dragElement(document.getElementById(("layers")));
}]);




// Home controller
editApp.controller('HomeController', ['$scope',
function($scope){
    $scope.createBlankHandler = function() {
        var width = document.getElementById("cbcw").value;
        var height = document.getElementById("cbch").value;

        console.log("Create blank canvas with", width, height);
        var path = "#!/editor/createBlankCanvas/" + width + "/" + height;
        location.href = path;
    }
}]);
