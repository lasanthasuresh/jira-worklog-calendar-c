import { Injectable } from '@angular/core';
import axios from 'axios';
import { AccountInfo } from './account-info';

@Injectable ({
  providedIn: 'root'
})
export class JiraService {
  constructor () {
  }

  async getProfile (accountInfo: AccountInfo) {
    const userProfiles = await axios.get (
      `${ accountInfo.urlBase }/rest/api/3/user/search?query=${ accountInfo.username }`,
      this.authConfig (accountInfo)
    );
    return userProfiles.data[0];
  }


  async getRecentlyViewedTickets (accountInfo: AccountInfo) {
    const jql = 'order by lastViewed DESC';
    const response = await axios.get (
      `${ accountInfo.urlBase }/rest/api/3/search?jql=${ jql }&fields=summary&maxResults=250`,
      this.authConfig (accountInfo)
    );
    const issues = response.data.issues;
    console.log (issues);

    return issues.map (it => ( {
      key: it.key,
      url: `${ accountInfo.urlBase }/browse/${ it.key }`,
      summary: it.fields.summary
    } ));
  }

  async getIssueSummary (ticketId: string, accountInfo: AccountInfo) {
    const issue = await axios.get (
      `${ accountInfo.urlBase }/rest/api/3/issue/${ ticketId }?fields=summary`,
      this.authConfig (accountInfo)
    );
    return issue.data.fields.summary;
  }

  async createWorklog (data, accountInfo) {
    const url = `${ accountInfo.urlBase }/rest/api/3/issue/${ data.ticketId }/worklog`;
    const object = {
      timeSpent: data.timeSpent, // 60m
      comment: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.comment,
              }
            ]
          }
        ]
      },
      started: data.started //'2022-11-10T12:00:00.000+0530'
    };
    const response = await axios.post (
      url,
      object,
      this.authConfig (accountInfo)
    );
    console.log (response);
  }

  async updateWorklog (data, accountInfo) {
    console.log (data);
    const url = `${ accountInfo.urlBase }/rest/api/3/issue/${ data.ticketKey }/worklog/${ data.id }`;
    const object = {
      timeSpentSeconds: data.timeSpentSeconds, // 60m
      comment: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.commentStr,
              }
            ]
          }
        ]
      },
      started: data.started.toISOString ().replace ('Z', '+0000') //'2022-11-10T12:00:00.000+0530'
    };
    const response = await axios.put (
      url,
      object,
      this.authConfig (accountInfo)
    );

    return response.data;
  }

  async getAllWorklogs (accountInfo, ticketIds: string[] = null) {
    const jql = Boolean (ticketIds)
      ? `key in (${ ticketIds.join (',') })`
      : `worklogAuthor=currentUser() order by lastViewed`;
    const fields = '&fields=key,summary';

    const response = await axios.get (
      `${ accountInfo.urlBase }/rest/api/3/search?jql=${ jql }${ fields }`, this.authConfig (accountInfo)
    );

    const tickets = response.data.issues;

    const worklogs = [];
    const promises = [];

    for ( const ticketWrapper of tickets ) {

      const worklogUrl = `${ accountInfo.urlBase }/rest/api/3/issue/${ ticketWrapper.key }/worklog`;
      const worklogPromise = axios.get (
        worklogUrl, this.authConfig (accountInfo)
      );

      promises.push (worklogPromise.then (worklogResponse => {
        const ticket = ticketWrapper.fields;
        for ( const worklog of worklogResponse.data.worklogs ) {
          const started = new Date (worklog.started);
          const end = new Date (worklog.started);
          end.setSeconds (end.getSeconds () + worklog.timeSpentSeconds);
          if (worklog.author.accountId !== accountInfo.accountId) {
            continue;
          }
          const w = Object.assign ({}, worklog);
          w.ticketKey = ticketWrapper.key;
          w.ticketSummary = ticket.summary;
          w.started = started;
          w.end = end;
          w.commentStr = this.commentStr (w.comment);
          worklogs.push (w);
        }
      }));
    }

    await Promise.all (promises);
    return worklogs;
  }


  async deleteWorklog (data: any, accountInfo) {
    const url = `${ accountInfo.urlBase }/rest/api/3/issue/${ data.ticketKey }/worklog/${ data.id }`;
    const response = await axios.delete (
      url,
      this.authConfig (accountInfo)
    );

    return response.data;
  }

  private commentStr (comment) {
    return comment?.content?.map (
      it => it?.content?.map (c => c?.text).join ('\n')
    ).join ('\n');
  }

  private authConfig (accountInfo: AccountInfo) {
    return {
      auth: {
        username: accountInfo.username,
        password: accountInfo.password
      },
      headers: {
        'X-Atlassian-Token': 'no-check'
      }
    };
  }

}
