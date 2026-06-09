const divs = ['profile', 'projects', 'timeline', 'notes', 'resume', 'contact'];

const moveDirectionMap = {};
const widthMap = {};

divs.forEach((divId) => {
  const divElement = document.getElementById(divId);
  const divWidth = divElement.offsetWidth;

  divElement.style.right = `-${divWidth}px`;
  moveDirectionMap[`${divId}MoveDirection`] = 'offscreen';
  widthMap[`${divId}Width`] = divWidth;
});

function moveDiv(divId) {
  const divElement = document.getElementById(divId);
  const start = performance.now();
  const duration = 1000; // Animation duration in milliseconds
  const initialRight = parseInt(divElement.style.right) || 0;
  let targetRight;

  document.querySelector('.outer-headings').style.visibility = 'hidden';
  document.querySelector('.inner-headings').style.visibility = 'hidden';

  if (moveDirectionMap[`${divId}MoveDirection`] === 'offscreen') {
    targetRight = 0; // Move on screen
    moveDirectionMap[`${divId}MoveDirection`] = 'onscreen'; // Change direction for the next click
  } else {
    targetRight = -widthMap[`${divId}Width`]; // Move off screen to the right edge
    moveDirectionMap[`${divId}MoveDirection`] = 'offscreen'; // Change direction for the next click
  }

  function animate(currentTime) {
    const elapsed = currentTime - start;

    if (elapsed < duration) {
      const progress = elapsed / duration;
      const easeProgress = easeOutQuad(progress);

      const newRight = initialRight + (targetRight - initialRight) * easeProgress;

      divElement.style.right = newRight + 'px';

      requestAnimationFrame(animate);
    } else {
      divElement.style.right = targetRight + 'px';
      handleHeadingsVisibility();
    }
  }

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  requestAnimationFrame(animate);
}

divs.forEach((divId) => {
  const button = document.getElementById(`${divId}Button`);
  button.addEventListener('click', function () {
    moveDiv(divId);
  });
});

function handleHeadingsVisibility() {
  const allOffscreen = divs.every((divId) => moveDirectionMap[`${divId}MoveDirection`] === 'offscreen');
  const visibility = allOffscreen ? 'visible' : 'hidden';

  document.querySelector('.outer-headings').style.visibility = visibility;
  document.querySelector('.inner-headings').style.visibility = visibility;
}


// Refresh page when homeButton is clicked
document.getElementById('homeButton').addEventListener('click', function () {
    location.reload();
  });