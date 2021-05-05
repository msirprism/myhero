function couponStatus(parent, args, context) {
    return context.prisma.coupon.findOne({where: {id: parent.id}}).couponStatus_couponTocouponStatus()
}

function couponType(parent, args, context) {
    return context.prisma.coupon.findOne({where: {id: parent.id}}).couponType_couponTocouponType()
}

function merchant(parent, args, context) {
    return context.prisma.coupon.findOne({where: {id: parent.id}}).merchant_couponTomerchant()
}

function couponLocalities(parent, args, context) {
    return context.prisma.coupon.findOne({where: {id: parent.id}}).couponLocality()
}

function orders(parent, args, context) {
  return context.prisma.coupon.findOne({where: {id: parent.id}}).orders()
}

module.exports = {
    couponStatus,
    couponType,
    couponLocalities,
    orders,
    merchant,
}