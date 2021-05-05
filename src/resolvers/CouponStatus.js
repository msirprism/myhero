function coupons(parent, args, context) {
    return context.prisma.couponStatus.findOne({where: {id: parent.id}}).coupon()
}
  
module.exports = {
    coupons
}