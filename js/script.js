const video = document.getElementById("videoInput");
let alreadyInFrame = [];

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(start);

function start() {
  console.log("Models Loaded");

  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );

  console.log("video added");
}

async function recognizeFaces() {

  let speakStr = "Recognition Started";
      const utterance = new SpeechSynthesisUtterance(speakStr);
      speechSynthesis.speak(utterance);

  const labeledDescriptors = await loadLabeledImages();
  //   console.log(labeledDescriptors);
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7);

  console.log("Playing");
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    // console.log(resizedDetections);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });

    results.forEach((result, i) => {
      //   console.log(result);

      //Draw the box
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      //Get the best expression
      let exprArr = Object.values(resizedDetections[0].expressions);
      //   console.log(exprArr);
      const bestExpression = Object.keys(resizedDetections[0].expressions).find(
        (k) => resizedDetections[0].expressions[k] === Math.max(...exprArr)
      );
      console.log(result.toString() + " : ", bestExpression);
      drawBox.draw(canvas);

      let wordIndex = result.toString().lastIndexOf(" ");
      console.log(alreadyInFrame);

      let isExists = alreadyInFrame.find(
        ({ name }) => name === result.toString().substring(0, wordIndex)
      );

      if (isExists) {
        if (isExists.expression === bestExpression) {
          //Exit if the person is the same and expression hasnt changed
          return;
        } else {
          //Update the expression of an existing person
          alreadyInFrame = alreadyInFrame.map((person) =>
            person.name === result.toString().substring(0, wordIndex)
              ? { ...person, expression: bestExpression }
              : person
          );
          // alreadyInFrame[result.toString().substring(0, wordIndex)].expression = bestExpression;
        }
      } else {
        //Add a new person
        alreadyInFrame.push({
          name: result.toString().substring(0, wordIndex),
          expression: bestExpression,
        });
      }

      let speakStr =
        result.toString().substring(0, wordIndex) +
        " is " +
        bestExpression +
        "at the moment";
      const utterance = new SpeechSynthesisUtterance(speakStr);
      speechSynthesis.speak(utterance);
    });
  }, 2000);
}

function loadLabeledImages() {
  // const labels = [
  //   "Captain America",
  //   "Hawkeye",
  //   "Jim Rhodes",
  //   "Tony Stark",
  //   "Thor",
  //   "Captain Marvel",
  //   "Hirun Dilshan",
  // ];
  const labels = ['Hirun Dilshan'] // for WebCam
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `../labeled_images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        // console.log(label + i + JSON.stringify(detections));
        descriptions.push(detections.descriptor);
      }
      document.body.append(label + " Faces Loaded | ");
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}



      
document.getElementById("upload_widget").addEventListener("click", function(){
 dpUpload();
}, false);

var dplink = "";

function dpUpload() {
    var myWidget = cloudinary.createUploadWidget({
        cloudName: 'wishmalokaya', 
        uploadPreset: 'daredevil'}, (error, result) => { 
          if (!error && result && result.event === "success") { 
            console.log('Done! Here is the image info: ', result.info); 
            dplink = result.info.url;
          }
        }
      )
      myWidget.open();
}



