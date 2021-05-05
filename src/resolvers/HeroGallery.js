function hero(parent, args, context) {
  return context.prisma.heroGallery({ id: parent.id }).hero()
}

module.exports = {
	hero
}