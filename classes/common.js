async function responseJson(response, data, status, message) {
    response.json({ dataObject: data, status: status, message: message });
}

module.exports.responseJson = responseJson;
