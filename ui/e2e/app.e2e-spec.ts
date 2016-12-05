import { MyprojectPage } from './app.po';

describe('myproject App', function() {
  let page: MyprojectPage;

  beforeEach(() => {
    page = new MyprojectPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
