import React from 'react';
import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {api,setCsrf} from './lib/api';
jest.mock('./lib/api',()=>({api:jest.fn(),setCsrf:jest.fn()}));
beforeEach(()=>jest.clearAllMocks());
test('registration submits selected profile and establishes a session',async()=>{
  api.mockImplementation(path=>{if(path==='/auth/me')return Promise.reject(Error('unauthorized'));if(path==='/auth/register')return Promise.resolve({user:{id:'u',name:'User',accountType:'installer'},csrfToken:'token'});if(path==='/sites')return Promise.resolve([]);if(path==='/status')return Promise.resolve({dataMode:'demo',storage:'memory'});return Promise.reject(Error('unavailable'));});
  const user=userEvent.setup();render(<App/>);
  await user.click(await screen.findByRole('button',{name:'New to SunYield? Create an account'}));
  await user.type(screen.getByLabelText('Your name'),'User');await user.type(screen.getByLabelText('Email address'),'user@example.com');await user.type(screen.getByLabelText('Password'),'StrongPassword123!');await user.selectOptions(screen.getByLabelText('Account profile'),'installer');
  await user.click(screen.getByRole('button',{name:'Create account'}));
  await waitFor(()=>expect(api).toHaveBeenCalledWith('/auth/register',{method:'POST',body:{name:'User',email:'user@example.com',password:'StrongPassword123!',accountType:'installer'}}));
  expect(setCsrf).toHaveBeenCalledWith('token');expect(await screen.findByText(/Demo resource mode/)).toBeInTheDocument();expect(screen.getByText(/temporary storage/)).toBeInTheDocument();
});
test('login dependency failure is visible and stays on login',async()=>{api.mockRejectedValue(Error('Service unavailable'));const user=userEvent.setup();render(<App/>);await screen.findByRole('button',{name:'Sign in'});await user.type(screen.getByLabelText('Email address'),'user@example.com');await user.type(screen.getByLabelText('Password'),'StrongPassword123!');await user.click(screen.getByRole('button',{name:'Sign in'}));expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');});
