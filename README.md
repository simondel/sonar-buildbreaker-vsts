## Sonar build breaker
An extension that breaks your build whenever the quality gate in SonarQube/SonarCloud failed. 

### Marketplace
There are two extensions available on the marketplace, the [SonarCloud build breaker](https://marketplace.visualstudio.com/items?itemName=SimondeLang.sonarcloud-buildbreaker) and the [SonarQube build breaker](https://marketplace.visualstudio.com/items?itemName=SimondeLang.sonar-buildbreaker).

### Support
Need help with the extension or do you have feedback? Feel free to open an issue on this GitHub repository.

### Building older versions
In order to build older versions (or the current version) of the extension, you need to have [NodeJS](https://nodejs.org) (latest LTS) installed as well as [Git](https://git-scm.com/).

After installing NodeJS:
1. Clone this repository using Git.
2. Navigate to the _sonar-buildbreaker-vsts_ folder using a terminal
3. Checkout the [commit](https://github.com/simondel/sonar-buildbreaker-vsts/commits/master) you want to build. For example: `git checkout f7a6a88987f81ee6a5d091cad22dd8c1b2baf5aa`
4. Install the dependencies `npm install`
5. Build the extensions `npm run build`
6. Package the extensions `npm run pack`

There should now be `.vsix` files in the _sonar-buildbreaker-vsts_ folder.
