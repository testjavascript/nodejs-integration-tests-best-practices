# Tests Performance

## In-Memory DB
TL;DR: don't bother

A common time-consuming operation on a typical server is database query, and slow tests are bad.
Database queries are expensive, also because the data resides on the drive, which is very slowly relative to other parts of the computer.
One method to speed up the database for testing and local-development is to run the database on RAM, which is way faster than the drive.

But is it worth it? Probably not, and this is why:
1. SSD is pretty much a standard now, and they are blazingly fast compared to the old HHD.
2. It's preferred and easier to configure your database for non-durable settings to reduce database-related I/O drastically.
3. Usually, test scenarios don't involve much data, so the DB's I/O-speed becomes secondary.
4. The performance between in-memory and regular database with the correct settings is neglectable (if any). 
Detailed benchmarks and results can be found [here](https://github.com/testjavascript/integration-tests-a-z/issues/9#issuecomment-710674437).