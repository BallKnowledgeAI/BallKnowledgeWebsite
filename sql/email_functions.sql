-- Function to add email to waitlist
CREATE OR REPLACE FUNCTION add_to_waitlist(
  p_email VARCHAR(255),
  p_source VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message VARCHAR(255), id UUID) AS $$
BEGIN
  INSERT INTO waitlist(email, source)
  VALUES(LOWER(TRIM(p_email)), p_source)
  ON CONFLICT (email) 
  DO UPDATE SET updated_at = CURRENT_TIMESTAMP
  RETURNING true, 'Successfully added to waitlist'::VARCHAR(255), waitlist.id
  INTO success, message, id;
  
  RETURN NEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 'Error adding to waitlist'::VARCHAR(255), NULL::UUID;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email
CREATE OR REPLACE FUNCTION verify_email(p_email VARCHAR(255))
RETURNS TABLE(success BOOLEAN, message VARCHAR(255)) AS $$
BEGIN
  UPDATE waitlist
  SET verified = TRUE, verified_at = CURRENT_TIMESTAMP
  WHERE LOWER(email) = LOWER(p_email);
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Email verified successfully'::VARCHAR(255);
  ELSE
    RETURN QUERY SELECT false, 'Email not found'::VARCHAR(255);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 'Error verifying email'::VARCHAR(255);
END;
$$ LANGUAGE plpgsql;

-- Function to log email sent
CREATE OR REPLACE FUNCTION log_email_sent(
  p_recipient_email VARCHAR(255),
  p_subject VARCHAR(255),
  p_template_name VARCHAR(100) DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT 'sent',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO email_logs(recipient_email, subject, template_name, status, metadata)
  VALUES(LOWER(TRIM(p_recipient_email)), p_subject, p_template_name, p_status, p_metadata)
  RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id UUID)
RETURNS TABLE(
  campaign_name VARCHAR(255),
  total_sent INTEGER,
  successful INTEGER,
  failed INTEGER,
  bounced INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name,
    COUNT(l.id)::INTEGER as total_sent,
    COUNT(CASE WHEN l.status = 'sent' THEN 1 END)::INTEGER as successful,
    COUNT(CASE WHEN l.status = 'failed' THEN 1 END)::INTEGER as failed,
    COUNT(CASE WHEN l.status = 'bounced' THEN 1 END)::INTEGER as bounced
  FROM email_campaigns c
  LEFT JOIN email_logs l ON c.id = p_campaign_id AND l.template_name = c.template_name
  WHERE c.id = p_campaign_id
  GROUP BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to unsubscribe from emails
CREATE OR REPLACE FUNCTION unsubscribe_email(p_email VARCHAR(255))
RETURNS TABLE(success BOOLEAN, message VARCHAR(255)) AS $$
BEGIN
  INSERT INTO email_preferences(email, marketing_emails, newsletter)
  VALUES(LOWER(TRIM(p_email)), FALSE, FALSE)
  ON CONFLICT (email) 
  DO UPDATE SET 
    marketing_emails = FALSE, 
    newsletter = FALSE,
    unsubscribed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN QUERY SELECT true, 'Unsubscribed successfully'::VARCHAR(255);
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 'Error unsubscribing'::VARCHAR(255);
END;
$$ LANGUAGE plpgsql;

-- Function to get verified waitlist count
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS TABLE(
  total_subscribers INTEGER,
  verified_count INTEGER,
  unverified_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_subscribers,
    COUNT(CASE WHEN verified = TRUE THEN 1 END)::INTEGER as verified_count,
    COUNT(CASE WHEN verified = FALSE THEN 1 END)::INTEGER as unverified_count
  FROM waitlist;
END;
$$ LANGUAGE plpgsql;
