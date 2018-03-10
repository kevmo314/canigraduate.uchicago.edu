import { getUChicago } from './getUChicago';
import Watch from '../models/Watch';

function getRoot() {
  return getUChicago().collection('watches');
}

export default class Watches {
  static async list(): Promise<{ id: string; data: Watch }[]> {
    const snapshot = await getRoot().get();
    const results = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, data: doc.data() as Watch });
    });
    return results;
  }

  static async delete(id: string) {
    return getRoot()
      .doc(id)
      .delete();
  }

  static async set(id: string, data: Watch) {
    return getRoot()
      .doc(id)
      .set(data);
  }

  static async get(id: string): Promise<{ id: string; data: Watch }> {
    const snapshot = await getRoot()
      .doc(id)
      .get();
    return { id: id, data: snapshot.data() as Watch };
  }

  /**
   * Find courses matching a given term, course, and section.
   * @param term
   * @param course
   * @param section
   * @returns
   */
  static async find(
    term: string,
    course: string,
    section: string,
  ): Promise<{ id: string; data: Watch }[]> {
    // Firestore is not powerful enough to do wildcard queries on the server.
    // Luckily, since the data is relatively small, we will just filter manually here.
    return (await this.list()).filter(result => {
      const watch = result.data;
      return (
        (!watch.term || watch.term.toUpperCase() === term.toUpperCase()) &&
        (!watch.course ||
          watch.course.toUpperCase() === course.toUpperCase()) &&
        (!watch.section ||
          watch.section.toUpperCase() === section.toUpperCase())
      );
    });
  }
}
