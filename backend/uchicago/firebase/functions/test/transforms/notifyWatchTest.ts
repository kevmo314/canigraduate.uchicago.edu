import * as chai from 'chai';
import * as sinon from 'sinon';
import Watches from '../../src/firestore/Watches';
import Users from '../../src/firestore/Users';
import Config from '../../src/firestore/Config';
import notifyWatch from '../../src/transforms/notifyWatch';
import 'mocha';

const stubs = sinon.sandbox.create();

function buildWatch(uid, course, term, section) {
  return { id: null, data: { uid, course, term, section } };
}

describe('UChicago Watches', () => {
  const sent = [];

  afterEach(() => {
    sent.length = 0;
    stubs.restore();
  });

  beforeEach(() => {
    stubs.stub(Config, 'sendEmail').callsFake(options => sent.push(options));
    const getEmail = stubs.stub(Users, 'getEmail');
    getEmail.withArgs(1).resolves('mugit1@uchicago.edu');
    getEmail.withArgs(2).resolves('mugit2@uchicago.edu');
    getEmail.withArgs(3).resolves('mugit3@uchicago.edu');
    getEmail.withArgs(4).resolves('mugit4@uchicago.edu');
    getEmail.withArgs(5).resolves('mugit5@uchicago.edu');
    getEmail.withArgs(6).resolves('mugit6@uchicago.edu');
  });

  describe('basic functionality', () => {
    const params = {
      course: 'MATH 16100',
      term: 'Winter 2010',
      section: '01',
    };

    const previous = {
      enrollment: { enrolled: 4, maximum: 10 },
      secondaries: [],
    };

    const current = {
      enrollment: { enrolled: 5, maximum: 10 },
      secondaries: [],
    };

    it('should notify on matching', async () => {
      stubs
        .stub(Watches, 'list')
        .resolves([buildWatch(1, 'MATH 16100', 'Winter 2010', '01')]);

      await notifyWatch(params, previous, current);

      chai.expect(sent).to.have.length(1);
      chai.expect(sent[0].to).to.be.equal('mugit1@uchicago.edu');
      chai.expect(sent[0].bcc).to.be.equal('kdwang@uchicago.edu');
      chai.expect(sent[0].text).to.include('4/10 -> 5/10');
    });

    it('should notify on matching case insensitive', async () => {
      stubs
        .stub(Watches, 'list')
        .resolves([buildWatch(1, 'math 16100', 'Winter 2010', '01')]);

      await notifyWatch(params, previous, current);

      chai.expect(sent).to.have.length(1);
      chai.expect(sent[0].to).to.be.equal('mugit1@uchicago.edu');
      chai.expect(sent[0].bcc).to.be.equal('kdwang@uchicago.edu');
      chai.expect(sent[0].text).to.include('4/10 -> 5/10');
    });

    it('should not notify on non matching', async () => {
      stubs
        .stub(Watches, 'list')
        .resolves([buildWatch(1, 'MATH 15100', 'Winter 2010', '01')]);

      await notifyWatch(params, previous, current);

      chai.expect(sent).to.have.length(0);
    });

    it('should notify on wildcards', async () => {
      stubs
        .stub(Watches, 'list')
        .resolves([
          buildWatch(1, 'MATH 16100', 'Winter 2010', null),
          buildWatch(2, 'MATH 16100', null, '01'),
          buildWatch(3, null, 'Winter 2010', '01'),
          buildWatch(4, 'MATH 16100', null, null),
          buildWatch(5, null, 'Winter 2010', null),
          buildWatch(6, null, null, '01'),
        ]);

      await notifyWatch(params, previous, current);

      chai
        .expect(sent.map(x => x.to))
        .to.have.members([
          'mugit1@uchicago.edu',
          'mugit2@uchicago.edu',
          'mugit3@uchicago.edu',
          'mugit4@uchicago.edu',
          'mugit5@uchicago.edu',
          'mugit6@uchicago.edu',
        ]);
    });

    it('should not notify on no change', async () => {
      stubs
        .stub(Watches, 'list')
        .resolves([buildWatch(1, 'MATH 16100', 'Winter 2010', '01')]);

      await notifyWatch(params, previous, previous);

      chai.expect(sent).to.have.length(0);
    });

    it('should not notify from null diff', async () => {
      await notifyWatch(params, null, previous);

      chai.expect(sent).to.have.length(0);
    });
  });

  describe('secondaries notifications', () => {
    const params = {
      course: 'MATH 16100',
      term: 'Winter 2010',
      section: '01',
    };

    it('should notify on change', async () => {
      const previous = {
        enrollment: { enrolled: 4, maximum: 10 },
        secondaries: [{ id: '1', enrollment: { enrolled: 6, maximum: 12 } }],
      };

      const current = {
        enrollment: { enrolled: 5, maximum: 10 },
        secondaries: [{ id: '1', enrollment: { enrolled: 7, maximum: 12 } }],
      };

      stubs
        .stub(Watches, 'list')
        .resolves([buildWatch(1, 'MATH 16100', 'Winter 2010', '01')]);

      await notifyWatch(params, previous, current);

      chai.expect(sent).to.have.length(1);
      chai.expect(sent[0].text).to.include('4/10 -> 5/10');
      chai.expect(sent[0].text).to.include('6/12 -> 7/12');
    });

    it('should include no secondaries change', async () => {
      const previous = {
        enrollment: { enrolled: 4, maximum: 10 },
        secondaries: [{ id: '1', enrollment: { enrolled: 6, maximum: 12 } }],
      };

      const current = {
        enrollment: { enrolled: 5, maximum: 10 },
        secondaries: [{ id: '1', enrollment: { enrolled: 6, maximum: 12 } }],
      };

      stubs
        .stub(Watches, 'list')
        .resolves([buildWatch(1, 'MATH 16100', 'Winter 2010', '01')]);

      await notifyWatch(params, previous, current);

      chai.expect(sent).to.have.length(1);
      chai.expect(sent[0].text).to.include('4/10 -> 5/10');
      chai.expect(sent[0].text).to.include('6/12 -> 6/12 (no change)');
    });
  });
});
