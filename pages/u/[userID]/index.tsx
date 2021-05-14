import './styles.module.scss';
import Page from 'components/Page';
import { useUser } from 'modules/client/users';
import type { PublicUser } from 'modules/client/users';
import { getUserByUnsafeID, getPublicUser } from 'modules/server/users';
import { withErrorPage } from 'modules/client/errors';
import { withStatusCode } from 'modules/server/errors';
import Box from 'components/Box';
import BoxColumns from 'components/Box/BoxColumns';
import BoxSection from 'components/Box/BoxSection';
import BoxRowSection from 'components/Box/BoxRowSection';
import LabeledBoxRow from 'components/Box/LabeledBoxRow';
import Timestamp from 'components/Timestamp';
import Link from 'components/Link';
import BoxFooter from 'components/Box/BoxFooter';
import IconImage from 'components/IconImage';
import { Perm } from 'modules/client/perms';
import BoxRow from 'components/Box/BoxRow';
import BBCode from 'components/BBCode';
import { getPublicStoriesByEditor } from 'modules/server/stories';
import type { PublicStory } from 'modules/client/stories';
import StoryList from 'components/StoryList';
import Button from 'components/Button';

type ServerSideProps = {
	publicUser: PublicUser,
	publicStories: PublicStory[],
	favsPublic: boolean
} | {
	statusCode: number
};

const Component = withErrorPage<ServerSideProps>(({ publicUser, publicStories, favsPublic }) => {
	const user = useUser();

	const notOwnProfile = user?.id !== publicUser.id;

	return (
		<Page flashyTitle heading="Profile">
			<Box id="profile-box">
				<BoxColumns>
					<BoxSection id="profile-meta" heading="Meta">
						<BoxRow id="profile-name">
							{publicUser.name}
						</BoxRow>
						<BoxRow id="profile-icon-container">
							<IconImage id="profile-icon" src={publicUser.icon} />
						</BoxRow>
						<BoxRow id="profile-actions">
							{notOwnProfile && (
								<div>
									<Link href="/TODO">
										Send Message
									</Link>
								</div>
							)}
							{favsPublic && (
								<div>
									<Link href={`/u/${publicUser.id}/favs`}>
										View Favorites
									</Link>
								</div>
							)}
							{notOwnProfile && (
								<div>
									<Link href="/TODO">
										Report
									</Link>
								</div>
							)}
						</BoxRow>
					</BoxSection>
					<Box>
						<BoxRowSection id="profile-stats" heading="Stats">
							<LabeledBoxRow label="Last Connection">
								<Timestamp relative withTime>{publicUser.lastSeen}</Timestamp>
							</LabeledBoxRow>
							<LabeledBoxRow label="Joined MSPFA">
								<Timestamp>{publicUser.created}</Timestamp>
							</LabeledBoxRow>
							{publicUser.birthdate && (
								<LabeledBoxRow label="Birthdate">
									<Timestamp>{publicUser.birthdate}</Timestamp>
								</LabeledBoxRow>
							)}
						</BoxRowSection>
						{(publicUser.email || publicUser.site) && (
							<BoxRowSection id="profile-contact" heading="Contact">
								{publicUser.email && (
									<LabeledBoxRow label="Email">
										<Link
											href={`mailto:${publicUser.email}`}
											target="_blank"
										>
											{publicUser.email}
										</Link>
									</LabeledBoxRow>
								)}
								{publicUser.site && (
									<LabeledBoxRow label="Website">
										<Link
											href={publicUser.site}
											target="_blank"
										>
											{publicUser.site}
										</Link>
									</LabeledBoxRow>
								)}
							</BoxRowSection>
						)}
					</Box>
				</BoxColumns>
				{publicUser.description && (
					<BoxSection id="profile-description" heading="Description">
						<BBCode html>{publicUser.description}</BBCode>
					</BoxSection>
				)}
				{!!publicStories.length && (
					<BoxSection
						id="profile-stories"
						heading={`${publicUser.name}'s Adventures`}
						collapsible
						open
					>
						<StoryList>{publicStories}</StoryList>
					</BoxSection>
				)}
				{user && (
					user.id === publicUser.id
					|| !!(user.perms & Perm.sudoRead)
				) && (
					<BoxFooter>
						<Button href={`/u/${publicUser.id}/edit`}>
							Edit
						</Button>
					</BoxFooter>
				)}
			</Box>
		</Page>
	);
});

export default Component;

export const getServerSideProps = withStatusCode<ServerSideProps>(async ({ params }) => {
	const userFromParams = await getUserByUnsafeID(params.userID);

	if (userFromParams) {
		return {
			props: {
				publicUser: getPublicUser(userFromParams),
				publicStories: await getPublicStoriesByEditor(userFromParams),
				favsPublic: userFromParams.settings.favsPublic
			}
		};
	}

	return { props: { statusCode: 404 } };
});