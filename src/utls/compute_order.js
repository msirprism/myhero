//@ts-check


function calculateProducts(products = []) {
    if (!products || !products.length) {
        return;
    }
    const totalAmount = products.map(product => {
        const priceWithMarkUp = product.price + product.markUpPrice;
        if (!product.orderAddons || !product.orderAddons) {
            return priceWithMarkUp * product.quantity;
        }
        const totalAddons = calculateAddons(product.orderAddons);
        return (totalAddons + priceWithMarkUp) * product.quantity;
    });
    return totalAmount;
}

function calculateAddons(orderAddons = []) {
    if (!orderAddons || !orderAddons.length) {
        return 0;
    }
    return orderAddons.reduce((prev, orderAddon) => {
        return prev + (orderAddon.price + orderAddon.markUpPrice) * orderAddon.quanttiy;
    }, 0);
}