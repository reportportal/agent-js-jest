/*
 *  Copyright 2024 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

module.exports = class ReportingApi {
  constructor(reporter) {
    this.reporter = reporter;
  }

  /**
   * Send file to RP for the current test
   * @param {Object} file - file data.
   * file should look like this
   * {
          name: 'string',
          type: "image/png" or your file mimeType
            (supported types: 'image/*', application/ ['xml', 'javascript', 'json', 'css', 'php'],
            another format will be opened in a new browser tab ),
          content: file (string | Buffer)
   * }
   *
   * @param {String} description - file description (optional).
   */
  attachment(file, description) {
    this.reporter.sendLog({ message: description, file });
  }
};
