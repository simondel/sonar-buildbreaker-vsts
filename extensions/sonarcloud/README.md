## SonarCloud build breaker
An extension that breaks your build whenever the quality gate in SonarCloud failed. This plugin works with SonarQube extension for VSTS 5.x and SonarQube 9.9.x

### Usage
It is recommended to place the task after the 'Publish Quality Gate Result' task from SonarSource, this is because the official task has better error handling and you probably want to browse to SonarCloud if this task makes your build fail.

![usage](extensions/sonarcloud/images/usage.png)

### Input
The task requires one input, your SonarCloud endpoint. This is required in order to authenticate to SonarCloud instance:

![input](extensions/sonarcloud/images/input.png)

### SonarQube extension
This extension only supports SonarCloud. To get the same functionality for SonarQube, please check out the [SonarQube build breaker extension](https://marketplace.visualstudio.com/items?itemName=MarcelVermeulen.sonar-buildbreaker).