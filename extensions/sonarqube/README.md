## SonarQube build breaker
An extension that breaks your build whenever the quality gate in SonarQube failed. This plugin works with SonarQube extension for VSTS 4.x and SonarQube 6.x

### Usage
It is recommended to place the task after the 'Publish Quality Gate' task from SonarSource, this is because the official task has better error handling and you probably want to browse to SonarQube if this task makes your build fail.

![](extensions/sonarqube/images/usage.png)

### Input
The task requires one input, your SonarQube endpoint. This is required in order to authenticate to the SonarQube instance:

![](extensions/sonarqube/images/input.png)

### SonarCloud extension
This extension only supports SonarQube. To get the same functionality for SonarCloud, please check out the [SonarCloud build breaker extension](https://marketplace.visualstudio.com/items?itemName=SimondeLang.sonarcloud-buildbreaker).