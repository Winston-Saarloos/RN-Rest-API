// Contains various methods related to the sorting and filtering of images

// Example Filter String (encoded): U|181665$U|1546112
function parseFilterValues (filterString) {
    var parsedValue = decodeURI(filterString).split("$"); // Decode the parameter and split on the $ sign
    console.log(parsedValue);
    return parsedValue
}

module.exports.parseFilterValues = parseFilterValues;