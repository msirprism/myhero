function merchant(parent, args, context) {
  return context.prisma.addon.findOne({where: {id: parent.id}}).merchant_addonTomerchant();
}

function productAddons(parent, args, context){
  return context.prisma.addon.findOne({where: {id: parent.id}}).productAddon();
}

module.exports = {
	merchant,
	productAddons,
}