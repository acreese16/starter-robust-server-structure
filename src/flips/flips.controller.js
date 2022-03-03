const flips = require("../data/flips-data");
const counts = require("../data/counts.data");

// New middleware function to validate the request body
function bodyHasResultProperty(req, res, next) {
  const { data: { result } = {} } = req.body;
  if (result) {
    return next(); // Call `next()` without an error message if the result exists
  }
  next({ status: 400, message: "A 'result' property is required." });
}

function resultProprtyIsValid(req, res, next) {
  const { data: { result } = {} } = req.body;
  const validResult = ["heads", "tails", "edge"];
  if (validResult.includes(result)) {
    return next();
  }
  next({
    status: 400,
    message: `Value of the 'result' property must be one of ${validResult}. Received ${result}`,
  });
}

function flipExists(req, res, next) {
  // TODO: Follow instructions in the checkpoint to implement ths API.
  const { flipId } = req.params;
  const foundFlip = flips.find((flip) => flip.id === Number(flipId));

  if (foundFlip) {
    res.locals.flips = foundFlip;
    return next();
  } else {
    next({ status: 404, message: `Flip id not found: ${flipId}` });
  }
}

// Variable to hold the next ID
// Because some IDs may already be used, find the largest assigned ID
let lastFlipId = flips.reduce((maxId, flip) => Math.max(maxId, flip.id), 0);

function create(req, res) {
  // Route handler no longer has validation code.
  const { data: { result } = {} } = req.body;
  const newFlip = {
    id: ++lastFlipId, // Increment last ID, then assign as the current ID
    result: result,
  };
  flips.push(newFlip);
  counts[result] = counts[result] + 1;
  res.status(201).json({ data: newFlip });
}

function list(req, res) {
  const { countId } = req.params;
  const byResult = countId ? (flip) => flip.result === countId : () => true;
  res.json({ data: flips.filter(byResult) });
}

function read(req, res, next) {
  res.json({ data: res.locals.flip });
}

function update(req, res, next) {
  const flip = res.locals.flip;
  const originalResult = flip.result;
  const { data: { result } = {} } = req.body;

  if (originalResult !== result) {
    // Update the flip
    flip.result = result;
    // Adjust the counts
    counts[originalResult] = counts[originalResult] - 1;
    counts[result] = counts[result] + 1;
  }

  res.json({ data: flip });
}

function destroy(req, res) {
  const { flipId } = req.params;
  const index = flips.findIndex((flip) => flip.id === Number(flipId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedFlips = flips.splice(index, 1);
  deletedFlips.forEach(
    (deletedFlip) =>
      (counts[deletedFlip.result] = counts[deletedFlip.result] - 1)
  );

  res.sendStatus(204);
}

module.exports = {
  create: [bodyHasResultProperty, resultProprtyIsValid, create],
  list,
  read: [flipExists, read],
  update: [flipExists, bodyHasResultProperty, resultProprtyIsValid, update],
  delete: [flipExists, destroy],
};
