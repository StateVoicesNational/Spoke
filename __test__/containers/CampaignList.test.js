/**
 * @jest-environment jsdom
 */
import React from 'react'
import { mount } from 'enzyme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { CampaignList } from '../../src/containers/CampaignList'

describe('Campaign list for campaign with null creator', () => {
  // given
  const campaignWithoutCreator = {
    id: 1,
    title: 'Yes on A',
    creator: null,
  }

  const data = {
    organization: {
      campaigns: {
        campaigns: [ campaignWithoutCreator ],
      },
    },
  }

  // when
  test('Renders for campaign with null creator, doesn\'t include created by', () => {
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignList data={data} />
      </MuiThemeProvider>
    )
    expect(wrapper.text().includes('Created by')).toBeFalsy()
  })
})

describe('Campaign list for campaign with creator', () => {
  // given
  const campaignWithCreator = {
    id: 1,
    creator: {
      displayName: 'Lorem Ipsum'
    },
  }

  const data = {
    organization: {
      campaigns: {
        campaigns: [ campaignWithCreator ],
      },
    },
  }

  // when
  test('Renders for campaign with creator, includes created by', () => {
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignList data={data} />
      </MuiThemeProvider>
    )
    expect(wrapper.containsMatchingElement(<span> &mdash; Created by Lorem Ipsum</span>)).toBeTruthy()
  })
})

