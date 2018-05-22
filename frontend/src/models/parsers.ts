export default {
  uchicago(course: string): [string, number] {
    const tokens = course.split(" ");
    return [tokens[0], parseInt(tokens[1])];
  }
};
