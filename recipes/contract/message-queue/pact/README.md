Initiate the pact broker at *localhost:9292* with **docker-compose** using the *yml* file inside *docker* directory.

In order to create a *pact* file, run any of the **consumer** tests. Pacts should be created at the *pacts* directory. 

To publish pacts to the broker (at *localhost:9292*), run:
```
npm run pact:publish
```

To verify the provider using the pact broker, run the **proivder** test.