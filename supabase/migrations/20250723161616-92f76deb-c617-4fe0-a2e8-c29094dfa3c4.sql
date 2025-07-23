-- Delete the test user so they can sign up again with the updated email flow
DELETE FROM auth.users WHERE email = 'hollandoak123@gmail.com';