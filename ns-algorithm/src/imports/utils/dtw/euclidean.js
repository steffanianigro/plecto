export const distance = (x, y) => {
    var difference = x - y;
    var euclideanDistance = Math.sqrt(difference * difference);
    return euclideanDistance;
};
