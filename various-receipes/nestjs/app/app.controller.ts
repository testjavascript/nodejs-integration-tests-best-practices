import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('/hello')
  getHello() {
    // ️️️Here we just exemplifies a simple route and the setup of Nest.js.
    // To learn about testing patterns of real-world app, look at the main example under "example-application" folder
    return {
      greeting: 'Testing is fun!'
    };
  }
}