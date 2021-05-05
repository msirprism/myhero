//@ts-check
/**
 * 
 * @param {Number} orderStatusId
 * @returns {NotificationResponse}
 */
const customerNotificationMessage = (orderStatusId) => {
    switch (orderStatusId) {
        case 5:
            return {
                title: "🦸‍♂️ A hero will arrive shortly to save your cravings.",
                body: "Order Request. Tap here for more info.",
            }
        case 6:
            return {
                title: "Your food has arrived",
                body: "Order Request. Tap here for more info.",
            }
        default:
            return {
                title: "Hey, We have an update for you!",
                body: "Order Request. Tap here for more info."
            }
    }
}

/**
 * @returns {NotificationResponse}
 */
const riderNotificationMessage = ({ id = 0, orderStatusId = 0, name = "No response" }) => {
    if (orderStatusId === 2) {
        return {
            title: `🦸‍♂️ORDER #${id} UPDATE‼`,
            body: `STATUS:${name}`,
        }
    }
    return null;
}
/**
 * 
 * @param {{id: Number,orderStatusId:Number,name:String}} param0 
 * @returns {NotificationResponse} response
 */
const merchantNotificationMessage = ({ id, orderStatusId }) => {
    const body = `STATUS: ${name}`;
    switch (orderStatusId) {
        case 1:
            return {
                title: "Be a real Hero by accepting orders.",
                body,
            }
        case 3:
            return {
                title: `ORDER #${id}`,
                body,
            }
        case 7:
            return {
                title: `ORDER #${id} successfully ${name}`,
                body,
            }
        default:
            return null;
    }
}



/**
 * @typedef {Object} OrderStatusNotification
 * @property {Number} orderStatusId
 * @property {Boolean} bold
 */
/**
 * @typedef {Object} NotificationResponse
 * @property {String} title
 * @property {String} body
 */