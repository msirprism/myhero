function coupon(parent, args, context) {
    return context.prisma.couponLocality.findOne({where: {id: parent.id}}).coupon_couponTocouponLocality()
}

module.exports = {
    coupon
}