const defaultOption = {
  title: "민주시민교육부"
};

const links = {};

const option = changes => {
  const link = changes['link'];
  const title = changes['title'];
  if(link && title) links[link.substring(link.indexOf("-"), link.length)] = title.substring(0, title.length - 6);

  return Object.assign({}, defaultOption, changes);
};
const titler = s => s + "";

module.exports = {
  option,
  titler
};